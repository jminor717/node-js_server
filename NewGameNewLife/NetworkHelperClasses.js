
/**
 * class used to track PeerJs connections 
 */
class connectionTracker {
    constructor() {
        this.connectionsById = [];
        this.connectionArr = [{ isServer: false, PeerId: "", PeerJsConnection: {} }]// present so that VScode knows what type this will be
        this.connectionArr.pop();
    }

    push(connection, id) {
        if (Object.keys(this.connectionsById).includes(id)) {
            this.connectionArr.find(x => x.PeerId == id).PeerJsConnection = connection
        } else {
            this.connectionArr.push({ isServer: false, PeerId: id, PeerJsConnection: connection })
        }
        this.connectionsById[id] = connection
    }

    remove(id) {
        delete this.connectionsById[id];
        this.connectionArr = this.connectionArr.filter(x => x.PeerId != id)
    }

    /**
     * 
     * @param {string} id 
     * @returns PeerJs connection
     */
    getCon(id) {
        return this.connectionsById[id]
    }

    /**
     * 
     * @param {string} id 
     */
    setServer(id) {
        for (const con of this.connectionArr) {
            if (con.PeerId === id) {
                con.isServer = true;
            } else {
                con.isServer = false;
            }
        }
    }

    /**
     * 
     * @returns the PeerJs Connection object for the current server
     */
    getServer() {
        return this.connectionArr.find(x => x.isServer == true)?.PeerJsConnection;
    }

    closeAllConnections() {
        this.connectionArr.forEach(x => {
            x.PeerJsConnection.close();
        });
        this.connectionArr = [];
        this.connectionsById = [];
    }

    /**
     * 
     * @returns {number} number of connections tracked by this instance
     */
    numConnection = () => this.connectionArr.length

    /**
     * 
     * @returns {string[]} list of string Ids for the connections tracked by this instance
     */
    allPeerIds = () => Object.keys(this.connectionsById)
}


class VotingSession {

    static MAX_VOTE = 268435456;

    start = 0;
    end = 0;
    vote = 0;
    otherVotes = [{ vote: 0, id: "" }];

    /**
     * 
     * @param {VotingSession} remoteSession voting session started by remote server
     * @param {string} id of the remote session
     * @param {*} _vote manual override of the random vote for this session
     */
    constructor(remoteSession = null, id = null, _vote = null) {
        if (remoteSession === null && id === null) {
            this.start = Date.now() - 5000;
            this.end = Date.now() + 5000;
            this.castVote();
            this.otherVotes = [];
        } else {
            this.start = remoteSession.start;
            this.end = remoteSession.end;
            this.vote = null;
            this.otherVotes = [{ vote: remoteSession.vote, id: id }];
        }
        if (_vote) {
            this.vote = _vote;
        }
    }

    /**
     * generate a random vote for this session
     */
    castVote() {
        let ret = this.vote === null;
        this.vote = Math.floor(Math.random() * VotingSession.MAX_VOTE);
        return ret;
    }

    Expire() {
        this.end = 0;
        this.start = 0;
    }

    /**
     * 
     * @param {VotingSession} other vote cast by remote session
     * @param {string} id of remote session
     */
    addOtherSession(other, id) {
        if (this.start > other.start) {
            this.start = other.start;
        }
        if (this.end < other.end) {
            this.end = other.end;
        }
        this.otherVotes.push({ vote: other.vote, id: id })
    }


    /**
     * 
     * @param {number} totalExpected number of expected remote sessions that should cast a vote
     * @returns {true | string | null} true if this instance should become server string to indicate which other instance should become server or null to indicate voting has not finished yet
     */
    checkWinner(totalExpected) {
        if (this.otherVotes.length >= totalExpected) {
            this.otherVotes = this.otherVotes.sort((a, b) => b.vote - a.vote);
            if (this.otherVotes[0].vote < this.vote) {
                console.log(`becoming Server with vote ${this.vote}`);
                return true;
            }
            console.log(`${this.otherVotes[0].id} should become server with vote ${this.otherVotes[0].vote}`);
            return this.otherVotes[0].id;
        }
        console.log(`waiting for ${totalExpected} votes, received ${this.otherVotes.length}`)
        return null;
    }

    /**
     * 
     * @returns {boolean} true if the current session is active
     */
    IsActive() { return Date.now() > this.start && Date.now() < this.end };
}

/** * @returns {string} UUID string */
function uuid_v4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

class PeerJsNetwork {

    currentSession = new VotingSession();
    connTracker = new connectionTracker();

    RemovedInitialPeers = {};
    ExpectedInitialPeers = [];
    ReceivedInitialPeers = [];

    AmServer = false;
    SelfPeer;
    MY_ID = "";

    GET_OTHER_PLAYERS_FROM_NODE = true;
    static SERVER_ID = "Test_Server_ID_2f3567ed-fdf9-4792-900b-997af04c5d71";


    static MESSAGE_TYPES = {
        ConInit: "initialConnect",
        ConForwarding: "ConForwarding",
        ServerArbitrage: "ServerArbitrage"
    }

    WindowLog = (strung) => { }

    OnData = (data, from) => { }
    OnPeerConnected = (remoteId) => { }
    OnPeerDisconnected = (remoteId) => { }
    OnNetworkReady = () => {}

    constructor() {
        this.currentSession.Expire();

    }

    JoinNetwork() {
        return this._sendPeerIdUpdate({ Action: "JoinNetwork", MyId: this.MY_ID })
    }

    LeaveNetwork() {
        this._sendPeerIdUpdate({ Action: "LeaveNetwork", RemoveId: this.MY_ID })
    }

    NotifyPlayerLeftNetwork(playerId) {
        this.connTracker.remove(playerId)
        this.OnPeerDisconnected(playerId)
        this._sendPeerIdUpdate({ Action: "LeaveNetwork", RemoveId: playerId })
    }

    JoinServer(serverName) {
        this._sendPeerIdUpdate({ Action: "JoinServer", MyId: this.MY_ID, ServerName: serverName }).then(data => {
            if (!data.Response.error) {
                data.Servers
                this.ExpectedInitialPeers = data.Servers[serverName].Players.concat([data.Servers[serverName].Host]).filter((x) => x.length > 3);
                console.log("attempting contact with", this.ExpectedInitialPeers);
                if (!this.ExpectedInitialPeers.includes(this.MY_ID)) {
                    console.log("Was not added to the server");
                    return;
                }
                this.ExpectedInitialPeers.forEach(id => {
                    if (id != this.MY_ID && id.length > 3) {
                        // let peer = this.SelfPeer.connect(id);
                        // setTimeout(() => {
                        //     this._setupConnection(peer, id)
                        // }, 1000);
                        this._setupConnection(this.SelfPeer.connect(id), id)
                    }
                })
            }
        })
    }

    LeaveServer() {
        this._sendPeerIdUpdate({ Action: "LeaveServer", MyId: this.MY_ID }).then(x => {
            this.connTracker.closeAllConnections();
        })
    }

    CreateServer(serverName) {
        this._sendPeerIdUpdate({ Action: "CreateServer", MyId: this.MY_ID, ServerName: serverName }).then(x => {
            this.AmServer = true;
            this.connTracker.setServer("");
        })
    }

    Broadcast(message, excludeList = []) {
        for (const CON of this.connTracker.connectionArr) {
            if (!excludeList.includes(CON.PeerId)) {
                // console.log("cast", CON.PeerJsConnection, message)
                CON.PeerJsConnection.send(message);
            }
        }
    }

    SendToServer(message) {
        if (!this.AmServer) {
            this.connTracker.getServer().send(message);
        }
    }

    start(AsServer) {
        let ConId = AsServer ? PeerJsNetwork.SERVER_ID : `PEER_${uuid_v4()}`;
        console.log(`start ${ConId}`)

        // { url: 'stun:stun.l.google.com:19302' },
        // { url: 'turn:homeo@turn.bistri.com:80', credential: 'homeo' }
        const iceConfiguration = {
            iceServers: [
                {
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credentials: 'openrelayproject'
                }
            ],
        }
        const cfg = {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                //{ url: 'turn:turn.bistri.com:80', username: "homeo", credential: 'homeo' }
            ]
        }

        // this.SelfPeer = new Peer(ConId);
        // this.SelfPeer = new Peer(ConId, {
        //     //config: cfg
        //     debug: 2
        // });

        this.SelfPeer = new Peer({
            host: '/',
            secure: false,
            port: 9000,
            path: '/'
        })

        this.SelfPeer.on('open', (id) => {
            this.AmServer = AsServer;
            this.MY_ID = id;
            this.WindowLog('My peer ID is: ' + id);
            this.OnNetworkReady();
            // this.JoinNetwork();

            // if (this.GET_OTHER_PLAYERS_FROM_NODE) {
            //     this._getPeersFromNode().then(x => {
            //         console.log("from node ", x);
            //         // this.ExpectedInitialPeers = x.ids;
            //         // x.ids.forEach(id => {
            //         //     if (id != this.MY_ID) {
            //         //         setTimeout(() => {
            //         //             this._setupConnection(this.SelfPeer.connect(id), id)
            //         //         }, 100);
            //         //         // this._setupConnection(this.SelfPeer.connect(id), id)
            //         //     }
            //         // })
            //     })
            // } else if (!this.AmServer) {
            //     this._setupConnection(this.SelfPeer.connect(PeerJsNetwork.SERVER_ID), PeerJsNetwork.SERVER_ID)
            // }


        });
        this.SelfPeer.on('error', (err) => {
            if (err.type == "unavailable-id") {
                this.SelfPeer = null;
                this.start(false)
            } else if (err.type == "peer-unavailable") {
                if (this.GET_OTHER_PLAYERS_FROM_NODE) {
                    let errData = err.message.split("Could not connect to peer ");
                    let FailedConId = errData[1];
                    if (FailedConId) {
                        if (!this.RemovedInitialPeers[FailedConId]) {
                            this.RemovedInitialPeers[FailedConId] = 1;
                        }
                        this.RemovedInitialPeers[FailedConId]++;
                        if (this.RemovedInitialPeers[FailedConId] <= 2) {
                            this.NotifyPlayerLeftNetwork(FailedConId);
                        }
                    }
                }
            } else {
                console.error(err);
            }
        });
        this.SelfPeer.on("connection", (conn) => {
            console.log("connection incoming", conn);
            // setTimeout(() => {
            //     this._setupConnection(conn, conn.peer);
            // }, 100);
            this._setupConnection(conn)
        });
    }

    _setupConnection(conn, Id) {
        console.log("setup Connection ", conn, Id)
        let peerID = "";
        if (Id) {
            peerID = Id;
            this.connTracker.push(conn, peerID)
            // this.OnPeerConnected(peerID);
            if (peerID === PeerJsNetwork.SERVER_ID) {
                this.connTracker.setServer(peerID)
            }
        }

        conn.on("data", (data) => {
            // data.from = peerID;
            // console.log("is server", this.AmServer, data);
            // this.WindowLog(data)
            if (data.type === PeerJsNetwork.MESSAGE_TYPES.ConInit) {
                peerID = data.myId
                this.connTracker.push(conn, peerID);
                this.OnPeerConnected(peerID);

                let HasAllPeers = true;
                if (this.GET_OTHER_PLAYERS_FROM_NODE) {
                    this.ReceivedInitialPeers.push(peerID)
                    HasAllPeers = this.ReceivedInitialPeers.concat(Object.keys(this.RemovedInitialPeers)).length >= this.ExpectedInitialPeers.length
                }

                if (data.isServer) {
                    this.connTracker.setServer(peerID);
                } else if (this.AmServer) {
                    this.Broadcast({ type: PeerJsNetwork.MESSAGE_TYPES.ConForwarding, data: [peerID] }, [peerID]);
                } else if (!this.AmServer && !this.connTracker.getServer() && HasAllPeers) {
                    let voteSent = this._readyVotingSession()
                    console.log(`starting Arbitrage from join ${voteSent} ${this.currentSession.vote} ${this.AmServer} ${this.connTracker.getServer()} ${HasAllPeers}`)
                    if (!voteSent) {
                        this.Broadcast({ type: PeerJsNetwork.MESSAGE_TYPES.ServerArbitrage, data: this.currentSession })
                    }
                }
            }
            else if (data.type === PeerJsNetwork.MESSAGE_TYPES.ConForwarding) {
                for (const OtherId of data.data) {
                    // console.log(`setup connection with ${OtherId} known con ${this.connTracker.getCon(OtherId)}`)
                    if (!this.connTracker.getCon(OtherId)) {
                        setTimeout(() => {
                            this._setupConnection(this.SelfPeer.connect(OtherId), OtherId)
                        }, 100);
                        // this._setupConnection(this.SelfPeer.connect(OtherId), OtherId)
                    }
                }
            }
            else if (data.type === PeerJsNetwork.MESSAGE_TYPES.ServerArbitrage) {
                console.log("Network Vote", currentSession?.IsActive())
                if (this.currentSession?.IsActive()) {
                    this.currentSession.addOtherSession(data.data, peerID);
                } else {
                    this._readyVotingSession(data.data, peerID);
                    this.Broadcast({ type: PeerJsNetwork.MESSAGE_TYPES.ServerArbitrage, data: this.currentSession });
                }
                this._checkVotingSession();
            }
            else {
                this.OnData(data, peerID)
            }
        });
        conn.on("open", () => {
            console.log(`Connection Open with ${peerID}`)
            // send my id to the other end,
            // this is necessary because the server doesn't know the ids of clients that are connecting to it
            conn.send({ type: PeerJsNetwork.MESSAGE_TYPES.ConInit, myId: this.MY_ID, isServer: this.AmServer });
            if (this.AmServer && this.connTracker.numConnection() > 0) {
                // the server should send a list of all the other clients it has to this client so that all clients are aware of eachother
                conn.send({ type: PeerJsNetwork.MESSAGE_TYPES.ConForwarding, data: this.connTracker.allPeerIds() });
            }
        });

        conn.on("close", () => {
            console.log(`disconnected: ${peerID}`);
            this.NotifyPlayerLeftNetwork(peerID);
            if (!this.connTracker.getServer() && !this.AmServer) {
                if (this.connTracker.numConnection() === 0) {
                    // no active connections assume the server role
                    console.log("becoming Server by default")
                    if (this.GET_OTHER_PLAYERS_FROM_NODE) {
                        this.AmServer = true;
                    } else {
                        this.start(true)
                    }
                } else {
                    // other active connection that need to be negotiated with for server role
                    let voteSent = this._readyVotingSession()
                    console.log(`starting Arbitrage from close ${currentSession.vote}`)
                    if (!voteSent) {
                        this.Broadcast({ type: PeerJsNetwork.MESSAGE_TYPES.ServerArbitrage, data: this.currentSession })
                    }
                }
            }
        });
        conn.on('error', (err) => {
            console.log("connection setup failed ", err)
        });
    }

    _readyVotingSession(otherPeerData = null, peerID = null) {
        let voteAlreadySent;
        if (this.currentSession.IsActive()) {
            voteAlreadySent = this.currentSession.castVote()
            if (otherPeerData && peerID) {
                this.currentSession.addOtherSession(otherPeerData, peerID)
            }
        } else {
            this.currentSession = new VotingSession(otherPeerData, peerID);
            voteAlreadySent = false;
        }
        return voteAlreadySent;
    }

    _checkVotingSession() {
        let newServerId = this.currentSession.checkWinner(this.connTracker.numConnection())
        if (newServerId === true) {
            if (this.GET_OTHER_PLAYERS_FROM_NODE) {
                this.AmServer = true;
                this.connTracker.setServer("");
                this.WindowLog(this.AmServer)
            } else {
                this.start(true)
            }
            this.currentSession.Expire();
        } else if (newServerId) {
            this.connTracker.setServer(newServerId);
            this.AmServer = false;
            this.currentSession.Expire();
        }
    }


    _sendPeerIdUpdate(body) {
        //if (this.GET_OTHER_PLAYERS_FROM_NODE) {
        return fetch("PeerIdUpdate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            .then(function (res) { return res.json(); });
        //.then(function (data) { console.log(data) })
        // }

    }

    /**
     * @returns {Promise<{ ids: [string] }>} the list of active ids known by Node
     */
    _getPeersFromNode() {
        return fetch("PeerIds",
            {
                method: "GET",
            })
            .then(function (res) { return res.json(); })
    }
}

function TestTracker() {
    let connTrack = new connectionTracker();
    console.log(connTrack)
    connTrack.push({ dat: 1 }, "tees12")
    connTrack.push({ dat: 2 }, "tees1234")
    connTrack.push({ dat: 3 }, "tees12345")
    console.log(connTrack)
    connTrack.setServer("tees12345")
    console.log(connTrack.getCon("tees12"))
    console.log(connTrack.getCon("tees1234"))
    console.log(connTrack.getServer())
    console.log(Object.keys(connTrack.connectionsById))
    connTrack.remove("tees1234")
    console.log(Object.keys(connTrack.connectionsById))
    connTrack.remove("tees12345")
    console.log(Object.keys(connTrack.connectionsById))
}

export { VotingSession, connectionTracker, PeerJsNetwork, TestTracker }