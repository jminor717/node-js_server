import { VotingSession, PeerJsNetwork } from './NetworkHelperClasses.js';


// testing specific functionality

let net = new PeerJsNetwork();

let init = false;
const SendData = {
    i: 0,
    message: "hi"
};



window.initConnection = () => {
    if (!init) {
        init = true;
        net.start(!net.GET_OTHER_PLAYERS_FROM_NODE);
        return;
    }
    SendData.i++;
    if (net.AmServer) {
        net.Broadcast(SendData)
    } else {
        net.Broadcast(SendData)
        // net.SendToServer(SendData)
    }
}
window.forceServer = () => {
    net.currentSession = new VotingSession(null, null, VotingSession.MAX_VOTE + 1);
    net.Broadcast({ type: PeerJsNetwork.MESSAGE_TYPES.ServerArbitrage, data: net.currentSession })
}

const ServerNameInput = document.getElementById("ServerName");

window.createServer = () => {
    net.CreateServer(ServerNameInput.value)
}
window.joinServer = () => {
    net.JoinServer(ServerNameInput.value)
}
window.leaveServer = () => {
    net.LeaveServer();
}


const consoleDiv = document.getElementById("Console__");

/**
 * 
 * @param {string} string message text
 * @param {number} logLevel 
 */
let WindowLog = (input, logLevel = 0) => {
    let string = "";
    if (typeof input === 'object' && input !== null) {
        string = JSON.stringify(input)
        // console.log(input);
    } else {
        string = input;
    }
    consoleDiv.innerHTML += string + "<br>";
}