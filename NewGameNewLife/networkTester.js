import { VotingSession, connectionTracker } from './NetworkHelperClasses.js';

let init = false;

const GET_OTHER_PLAYERS_FROM_NODE = true;
const SERVER_ID = "Test_Server_ID_2f3567ed-fdf9-4792-900b-997af04c5d71";

let AmServer = false;
let SelfPeer;
let MY_ID = "";

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

let currentSession = new VotingSession();
let connTracker = new connectionTracker();

function ReadyVotingSession(otherPeerData = null, peerID = null) {
    if (currentSession.IsActive()) {
        currentSession.castVote()
    } else {
        currentSession = new VotingSession(otherPeerData, peerID);
    }
    return currentSession;
}

function forceServer() {

    // TestTracker();
    currentSession = new VotingSession(null, null, VotingSession.MAX_VOTE + 1);
    Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
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
    if (AmServer) {
        Broadcast(SendData)
    } else {
        SendToServer(SendData)
    }
}

function Broadcast(message, excludeList = []) {
    for (const CON of connTracker.connectionArr) {
        if (!excludeList.includes(CON.PeerId)) {
            console.log("cast", CON.PeerJsConnection.peer, message)
            CON.PeerJsConnection.send(message);
        }
    }
}

function SendToServer(message) {
    if (!AmServer) {
        connTracker.getServer().PeerJsConnection.send(message);
    }
}

function SetupConnection(conn, Id) {
    let peerID = "";
    if (Id) {
        peerID = Id;
        connTracker.push(conn, peerID)
        if (peerID === SERVER_ID) {
            connTracker.setServer(peerID)
        }
    }

    conn.on("data", (data) => {
        data.from = peerID;
        WindowLog(data);

        if (data.type === MESSAGE_TYPES.ConInit) {
            peerID = data.myId
            connTracker.push(conn, peerID)
            if (data.isServer) {
                connTracker.setServer(peerID);
            } else if (AmServer) {
                Broadcast({ type: MESSAGE_TYPES.ConForwarding, data: [peerID] }, [peerID]);
            } else if (!AmServer && !connTracker.getServer()) {
                ReadyVotingSession()
                Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
            }
        }
        if (data.type === MESSAGE_TYPES.ConForwarding) {
            for (const OtherId of data.data) {
                console.log(`setup connection with ${OtherId} known con ${connTracker.getCon(OtherId)}`)
                if (!connTracker.getCon(OtherId)) {
                    SetupConnection(SelfPeer.connect(OtherId), OtherId)
                }
            }
        }
        if (data.type === MESSAGE_TYPES.ServerArbitrage) {
            console.log(currentSession, currentSession.IsActive(), data.data)
            if (currentSession?.IsActive()) {
                let newServerId = currentSession.addOtherSession(data.data, peerID, connTracker.numConnection())
                if (newServerId === true) {
                    WindowLog(`becoming Server from arb`)
                    if (GET_OTHER_PLAYERS_FROM_NODE) {
                        AmServer = true;
                    } else {
                        SelfPeer = null;
                        start(true)
                    }
                } else if (newServerId) {
                    WindowLog(`${newServerId} should become Server from arb`)
                    connTracker.setServer(newServerId);
                    AmServer = false;
                    // console.log(newServerId, connTracker.connectionArr)
                }
            } else {
                ReadyVotingSession(data.data, peerID)
                Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
            }
        }
    });
    conn.on("open", () => {
        // send my id to the other end,
        // this is necessary because the server doesn't know the ids of clients that are connecting to it
        conn.send({ type: MESSAGE_TYPES.ConInit, myId: MY_ID, isServer: AmServer });
        if (AmServer && connTracker.numConnection() > 0) {
            // the server should send a list of all the other clients it has to this client so that all clients are aware of eachother
            conn.send({ type: MESSAGE_TYPES.ConForwarding, data: connTracker.allPeerIds() });
        }
    });

    conn.on("close", () => {
        WindowLog(`disconnected: ${Id}`);
        sendPeerIdUpdate({ RemoveId: Id });
        connTracker.remove(Id)
        if (!connTracker.getServer() && !AmServer) {
            WindowLog(`need new server`);
            if (connTracker.numConnection() === 0) {
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
                ReadyVotingSession()
                Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
            }
        }

    });
}

let RemovedInitialPeers = {};

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
                console.log(x);
                x.ids.forEach(id => {
                    if (id != MY_ID) {
                        SetupConnection(SelfPeer.connect(id), id)
                    }
                })
            })
        } else if (!AmServer) {
            SetupConnection(SelfPeer.connect(SERVER_ID), SERVER_ID)
        }


    });
    SelfPeer.on('error', (err) => {
        if (err.type == "unavailable-id") {
            SelfPeer = null;
            start(false)
        } else if (err.type == "peer-unavailable") {
            if (GET_OTHER_PLAYERS_FROM_NODE) {
                let errData = err.message.split("Could not connect to peer ");
                let FailedConId = errData[1];
                if (FailedConId) {
                    if (!RemovedInitialPeers[FailedConId]) {
                        RemovedInitialPeers[FailedConId] = 1;
                    }
                    RemovedInitialPeers[FailedConId]++;
                    if (RemovedInitialPeers[FailedConId] <= 2) {
                        sendPeerIdUpdate({ RemoveId: FailedConId })
                        connTracker.remove(FailedConId)
                    }
                }
            }
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
    if (GET_OTHER_PLAYERS_FROM_NODE) {
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