let init = false;

const GET_OTHER_PLAYERS_FROM_NODE = true;
const SERVER_ID = "Test_Server_ID_2f3567ed-fdf9-4792-900b-997af04c5d71";

const NetworkedObjects = {}

let AmServer = false;
let SelfPeer;
let MY_ID = "";
let connections = [];



const MESSAGE_TYPES = {
    ConInit: "initialConnect",
    ConForwarding: "ConForwarding",
    ServerArbitrage: "ServerArbitrage"
}

// const peer = new Peer("someid", {
//     host: "localhost",
//     port: 9000,
//     path: "/myapp",
// });

class VotingSession {
    constructor(remoteSession= null, id= null) {
        if (remoteSession === null &&  id === null) {
            this.start = Date.now() - 5000;
            this.end = Date.now() + 5000;
            this.castVote();
            this.otherVotes = [];
        }else{
            this.start = remoteSession.start;
            this.end = remoteSession.end;
            this.vote = null;
            this.otherVotes = [{ vote: remoteSession.vote, id: id }];
        }
    }

    castVote(){
        this.vote = Math.floor(Math.random() * 268435456);
    }

    /**
     * 
     * @param {VotingSession} other 
     * @param {string} id 
     */
    addOtherSession(other, id) {
        if (this.start > other.start) {
            this.start = other.start;
        }
        if (this.end < other.end) {
            this.end = other.end;
        }
        this.otherVotes.push({ vote: other.vote, id: id })

        if (this.otherVotes.length >= Object.keys(connections).length) {
            this.otherVote = this.otherVotes.sort((a, b) => b.vote - a.vote);
            if (this.otherVotes[0].vote < this.vote) {
                WindowLog(`becoming Server with vote ${this.vote}`);
                return true;
            }
            WindowLog(`${this.otherVotes[0].id} should become server with vote ${this.otherVotes[0].vote}`);
        }
        return this.otherVotes[0].id;
    }

    IsActive() { return Date.now() > this.start && Date.now() < this.end };
}

let currentSession = new VotingSession();


function forceServer() {

}


const SendData = {
    i: 0,
    message: "hi"
};

function initConnection() {
    if (!init) {
        init = true;
        start(!GET_OTHER_PLAYERS_FROM_NODE);
        return;
    }
    SendData.i++;
    Broadcast(SendData)
}

function Broadcast(message, excludeList = []) {
    for (const key in connections) {
        if (connections.hasOwnProperty.call(connections, key)) {
            if (!excludeList.includes(key)) {
                const con = connections[key];
                con.send(message);
            }

        }
    }
}

function SetupConnection(conn, Id) {
    let peerID = "";
    if (Id) {
        peerID = Id;
        connections[peerID] = conn;
    }
    // console.log(conn);
    conn.on("data", (data) => {
        data.from = peerID;
        WindowLog(data);

        if (data.type === MESSAGE_TYPES.ConInit) {
            peerID = data.data
            connections[peerID] = conn;

            if (AmServer) {
                Broadcast({ type: MESSAGE_TYPES.ConForwarding, data: [peerID] }, [peerID]);
            }
        }
        if (data.type === MESSAGE_TYPES.ConForwarding) {
            for (const OtherId of data.data) {
                let PeerConnection = SelfPeer.connect(OtherId);
                SetupConnection(PeerConnection, OtherId)
            }
        }
        if (data.type === MESSAGE_TYPES.ServerArbitrage) {
            if (currentSession?.IsActive()) {
                let newServerId = currentSession.addOtherSession(data.data, peerID)
                if (newServerId === true) {
                    if (GET_OTHER_PLAYERS_FROM_NODE) {
                        AmServer = true;
                    } else {
                        SelfPeer = null;
                        start(true)
                    }
                } else {
                    connections[newServerId].IsServer = true
                    console.log(newServerId, connections)
                }
            }else{
                currentSession = new VotingSession(data.data, peerID);
            }
        }
    });
    conn.on("open", () => {
        // send my id to the other end,
        // this is necessary because the server doesn't know the ids of clients that are connecting to it
        conn.send({ type: MESSAGE_TYPES.ConInit, data: MY_ID });
        if (AmServer && Object.keys(connections).length > 0) {
            // the server should send a list of all the other clients it has to this client so that all clients are aware of eachother
            conn.send({ type: MESSAGE_TYPES.ConForwarding, data: Object.keys(connections) });
        }
    });

    conn.on("close", () => {
        WindowLog(`disconnected: ${Id}`);
        sendPeerIdUpdate({ RemoveId: Id });
        connections[Id] = null;
        delete connections[Id];
        console.log(connections.some(x => x.IsServer), connections)
        if (!connections.some(x => x.IsServer) && !AmServer) {
            WindowLog(`need new server`);
            console.log(connections)
            if (Object.keys(connections).length == 0) {
                // no active connections assume the server role
                // SelfPeer = null;
                WindowLog("becoming Server by default")
                if (GET_OTHER_PLAYERS_FROM_NODE) {
                    AmServer = true;
                } else {
                    start(true)
                }
            } else {
                // other active connection that need to be negotiated with for server role
                if (currentSession.IsActive()) {
                    currentSession.castVote()
                }else{
                    currentSession = new VotingSession();
                }
                Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
            }
        }

    });
}

async function start(AsServer) {
    let ConId = AsServer ? SERVER_ID : `PEER_${uuidv4()}`;
    console.log(`start ${ConId}`)
    SelfPeer = new Peer(ConId);

    SelfPeer.on('open', function (id) {
        AmServer = AsServer;
        MY_ID = id;

        WindowLog('My peer ID is: ' + id);
        sendPeerIdUpdate({ myId: MY_ID });

        if (GET_OTHER_PLAYERS_FROM_NODE) {
            GetPeersFromNode().then(x => {
                x.ids.forEach(id => {
                    if (id != MY_ID) {
                        let peerConn = SelfPeer.connect(id);
                        SetupConnection(peerConn, id)
                    }
                })
            })
        } else {
            if (!AmServer) {
                let ServerConn = SelfPeer.connect(SERVER_ID);
                SetupConnection(ServerConn, SERVER_ID)
            }
        }

    });
    SelfPeer.on('error', (err) => {
        if (err.type == "unavailable-id") {
            SelfPeer = null;
            start(false)
        } else if (err.type == "peer-unavailable") {
            if (GET_OTHER_PLAYERS_FROM_NODE) {
                let errData = err.message.split("Could not connect to peer ");
                if (errData[1]){
                    sendPeerIdUpdate({ RemoveId: errData[1] })
                }
            }
            // ServerConn = null;
        } else {
            console.log(err);
        }
    });
    SelfPeer.on("connection", (conn) => SetupConnection(conn));
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function sendPeerIdUpdate(body) {
    if (GET_OTHER_PLAYERS_FROM_NODE){
        console.log("sending Peer Update", body)
        fetch("PeerIdUpdate",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            })
            .then(function (res) { return res.json(); })
            .then(function (data) { console.log(JSON.stringify(data)) })
    }

}

/**
 * @returns {Promise<{ ids: [number] }>} the list of active ids known by Node
 */
function GetPeersFromNode() {
    return fetch("PeerIds",
        {
            method: "GET",
        })
        .then(function (res) { return res.json(); })
}


window.initConnection = initConnection
window.forceServer = forceServer


const consoleDiv = document.getElementById("Console__");

/**
 * 
 * @param {string} string message text
 * @param {number} logLevel 
 */
let WindowLog = (input, logLevel = 0) => {
    let string = "";
    if (typeof input === 'object' &&
        // !Array.isArray(input) &&
        input !== null) {
        string = JSON.stringify(input)
        // console.log(input);
    } else {
        string = input;
    }
    consoleDiv.innerHTML += string + "<br>";
}