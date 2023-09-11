// import * as Network from './ApplicationLayer.js';
let init = false;

const SERVER_ID = "Test_Server_ID_2f3567ed-fdf9-4792-900b-997af04c5d71";

const NetworkedObjects = {}
const SendData = {
    i: 0,
    message: "hi"
};
let AmServer = false;
let SelfPeer;
let MY_ID = "";
let connections = [];


let currentSession;

const MESSAGE_TYPES = {
    ConInit: "initialConnect",
    ConForwarding: "ConForwarding",
    ServerArbitrage: "ServerArbitrage"
}


class VotingSession {
    constructor() {
        this.start = Date.now() - 5000;
        this.end = Date.now() + 5000;
        this.vote = Math.floor(Math.random() * 268435456)
    }

    /**
     * 
     * @param {VotingSession} other 
     * @param {string} id 
     */
    addOtherSession(other, id) {
        if (!this.otherVotes) {
            this.otherVotes = [];
        }
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

// import * as Peer from "./../node_modules/peerjs/dist/peerjs.js";

// const peer = new Peer.Peer("pick-an-id");

// const peer = new Peer("someid", {
//     host: "localhost",
//     port: 9000,
//     path: "/myapp",
// });


// const conn = peer.connect("someid");

// conn.on("open", () => {
//     WindowLog("open");
//     conn.send("hi!");
// });


function initConnection() {
    if (!init) {
        init = true;
        start(SERVER_ID);
        return;
    }
    SendData.i++;


    Broadcast(SendData)
    // console.log(connections)
}

function Broadcast(message, excludeList = []) {
    for (const key in connections) {
        if (connections.hasOwnProperty.call(connections, key)) {
            if (!excludeList.includes(key)){
                const con = connections[key];
                con.send(message);
            }

        }
    }
}

function SetupConnection(conn, Id) {
    let peerID = "";
    if (Id) {
        peerID = id;
        connections[Id] = conn;
    }
    // console.log(conn);
    conn.on("data", (data) => {
        data.from = peerID;
        WindowLog(data);

        if (data.type === MESSAGE_TYPES.ConInit) {
            peerID = data.data
            if (AmServer) {
                // broadcast before updating the list of clients so we don't send this message to the new client
                Broadcast({ type: MESSAGE_TYPES.ConForwarding, data: [peerID] }, [peerID]);
            }
            connections[peerID] = conn;
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
                    SelfPeer = null;
                    start(SERVER_ID)
                } else {
                    connections[newServerId].IsServer = true
                }

            }
        }
    });
    conn.on("open", () => {
        // send my id to the other end,
        // this is necessary because the server doesn't know the ids of clients that are connecting to it
        if (peerID == SERVER_ID ) {
            conn.send({ type: MESSAGE_TYPES.ConInit, data: MY_ID });
        }
        if (AmServer && Object.keys(connections).length > 0) {
            // the server should send a list of all the other clients it has to this client so that all clients are aware of eachother
            conn.send({ type: MESSAGE_TYPES.ConForwarding, data: Object.keys(connections) });
        }
    });

    conn.on("close", () => {
        WindowLog(`disconnected: ${Id}`);
        connections[Id] = null;
        delete connections[Id];
        if (!connections.some(x = x.IsServer) && !AmServer) {
            WindowLog(`need new server`);
            if (Object.keys(connections).length == 0) {
                // no active connections assume the server role
                SelfPeer = null;
                start(SERVER_ID)
            } else {
                // other active connection that need to be negotiated with for server role
                currentSession = new VotingSession();
                Broadcast({ type: MESSAGE_TYPES.ServerArbitrage, data: currentSession })
            }
        }

    });
}

// Call start() to initiate.
async function start(ConId) {
    SelfPeer = new Peer(ConId);
    console.log("fin");
    SelfPeer.on('open', function (id) {
        WindowLog('My peer ID is: ' + id);
        MY_ID = id;
        AmServer = MY_ID == SERVER_ID;
        if (!AmServer) {
            let ServerConn = SelfPeer.connect(SERVER_ID);
            SetupConnection(ServerConn, SERVER_ID)
        }
    });
    SelfPeer.on('error', (err) => {
        if (err.type == "unavailable-id") {
            SelfPeer = null;
            start(`PEER_${uuidv4()}`)
        } else if (err.type == "peer-unavailable") {
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




window.initConnection = initConnection


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