import * as Network from './ApplicationLayer.js';

const NetworkedObjects = {}
const SendData = {
    i: 0,
    message: "hi"
};

Network.WaitForConnection().then((dat) => {
    console.log(dat);
}).catch((err) => {
    console.log(err);
})

Network.SetFullStateObject(NetworkedObjects);


Network.SetUpdatePacketCallback(applyUpdatesFromNetwork)
Network.NewPlayerCallback((newPeerObjects, PeerId) => {
    console.log("New Player", newPeerObjects, PeerId)
})
Network.PlayerLeftCallback((PeerId) => {
    console.log(PeerId)
})
Network.addServerChangedCallback(() => {
    console.log("become Server")
})

function applyUpdatesFromNetwork(receivedData){
    console.log(receivedData);
}

function initConnection(){
    SendData.i++;
    Network.SendJson(SendData);
}

window.initConnection = initConnection