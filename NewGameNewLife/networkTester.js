// import * as Network from './ApplicationLayer.js';
let init = false;

const ServerId = "Test_Server_ID_2f3567ed-fdf9-4792-900b-997af04c5d71";

const NetworkedObjects = {}
const SendData = {
    i: 0,
    message: "hi"
};
let otherIdd;
let connections = []


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
        start(ServerId);
        return;
    }
    SendData.i++;


    connections.forEach(con => {
        con.send(SendData);

    })
}

function SetupConnection(conn){
    connections.push(conn);
    if (!ServerConn) {
        ServerConn = conn;
    }
    console.log(conn);
    conn.on("data", (data) => {
        // Will print 'hi!'
        WindowLog(data);
    });
    conn.on("open", () => {
        WindowLog("send hello!");
        conn.send("hello!");
    });
    
}

// Call start() to initiate.
async function start(ConId) {
    let peer = new Peer(ConId);
    console.log("fin");
    peer.on('open', function (id) {
        console.log('My peer ID is: ' + id);
        if (ConId != ServerId){
            ServerConn = peer.connect(ServerId);
            SetupConnection(ServerConn)
        }
    });
    peer.on('error', (err) => {
        if (err.type == "unavailable-id") {
            peer = null;
            start(`PEER_${uuidv4()}`)
        } else if (err.type == "peer-unavailable"){
            ServerConn = null;
        }else{
            console.log(err);
        }
    });
    peer.on("connection", (conn) => SetupConnection(conn));
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
        !Array.isArray(input) &&
        input !== null) {
        string = JSON.stringify(input)
        // console.log(input);
    } else {
        string = input;
    }
    consoleDiv.innerHTML += string + "<br>";
}