import * as llNetwork from './transportLayer.js';
import * as Objects from './CompressedObjects.js';

let SendQueue = []
let NetworkResolve, NetworkReject;
let FullState = null;
let StateReceivedCallBack = null;
let NewPlayerJoinedCallback = null;
let trackedPlayers = {};

function GenerateNetworkPacket(networkObjects) {
    let data = [];
    // console.log(networkObjects);
    for (const key in networkObjects) {
        const object = networkObjects[key];
        for (const index in object) {
            const element = object[index];
            data = data.concat(element.ToArray());
        }
    }
    return data;
}

function GenerateStateFromBuffer(buffer) {
    let offset = 0;
    let output = {};
    while (offset < buffer.byteLength) {
        const obj = Objects.GenerateObjectFromArray(buffer, offset);
        offset += ((obj.ArrayLength + 1) * 4);
        if (output[obj.ID.ID] === null || output[obj.ID.ID] === undefined) {
            output[obj.ID.ID] = {}
            // output[obj.ID.ID].ObjectType = obj.ID.ObjectType
        }
        output[obj.ID.ID][obj.ID.index] = obj;
        // console.log(output[obj.ID.ID][obj.ID.index], offset);
        // objects.push(obj);
    }
    // console.log(output)
    return output;
}

function FlushSendQueue() {
    // console.log("sending", SendQueue)

    while (SendQueue.length > 0) {
        llNetwork.sendData(SendQueue.pop())
    }
}

function isAbv(value) {
    return value && value instanceof ArrayBuffer && value.byteLength !== undefined;
}

function receiveData(event, playerId) {
    console.log('received event:', event);
    if (isAbv(event.data)) {
        // console.log('received ArrayBuffer:', event.data.byteLength, ' bytes');
        let stuff = GenerateStateFromBuffer(event.data);
        // console.log(NetworkResolve, stuff)
        if (event.data.byteLength > 1000 && NetworkResolve) {
            NetworkResolve(stuff);
        }
        if (!trackedPlayers[playerId]) {
            if (NewPlayerJoinedCallback) {
                NewPlayerJoinedCallback(stuff, playerId)
                trackedPlayers[playerId] = { id: playerId };
            }
        }

        if (StateReceivedCallBack) {
            StateReceivedCallBack(stuff)
        }
    } else {
        // console.log('received:', event.data.length, ' bytes');
        try {
            let data = JSON.parse(event.data)
            // if (data?.cmd) {
                console.log(data);
            // }
        } catch (error) {
            try {
                console.log('received:', event.data.length, ' bytes string', event.data);
                if (FullState) {
                    console.log("sending Full State 1", FullState)
                    //llNetwork.sendData(Float32Array.from(GenerateNetworkPacket(FullState)).buffer)
                }
            } catch (error2) {
                console.log("Error", error2)
            }
        }
    }
}

async function WaitForConnection() {
    llNetwork.ContactServer();
    llNetwork.SetDataReceivedCallback(receiveData);
    llNetwork.addSendChannelReadyCallback(() => {
        FlushSendQueue();
        if (FullState) {
            console.log("sending Full State 2", FullState)
            llNetwork.sendData(Float32Array.from(GenerateNetworkPacket(FullState)).buffer)
        }
    })
    await llNetwork.WaitForNetwork;

    let WaitForOtherInit = new Promise(function (resolve, reject) {
        NetworkResolve = resolve;
        NetworkReject = reject;
    });

    setTimeout(() => NetworkReject("timeout"), 10000) //Math.floor(Math.random() * 3000)

    return await WaitForOtherInit;

}

function QueueObjectToSend(obj) {
    SendQueue.push(Float32Array.from(GenerateNetworkPacket(obj)).buffer)
    // console.log("Que_ing", llNetwork.ReadyToSend, SendQueue)
    if (llNetwork.ReadyToSend) {
        FlushSendQueue();
    }
}

function SendJson(obj){
    console.log(llNetwork.ReadyToSend, "Sending", obj)

    if (llNetwork.ReadyToSend) {
        console.log("Sending", obj)
        llNetwork.sendData(JSON.stringify(obj))
    }
}

function SetFullStateObject(obj) {
    // console.log("SetFullStateObject", Object.keys(obj).length)
    FullState = obj
    // let data = GenerateNetworkPacket(FullState)
    // var view = Float32Array.from(data);
    // console.log(FullState, GenerateStateFromBuffer(view.buffer));
}

function SetUpdatePacketCallback(cb) {
    StateReceivedCallBack = cb;
}

function NewPlayerCallback(cb) {
    NewPlayerJoinedCallback = cb;
}

function PlayerLeftCallback(cb) {
    llNetwork.addSendChannelCloseCallback(cb)
}



export { IsServer, MyClientID, addServerChangedCallback } from './transportLayer.js'
export { WaitForConnection, QueueObjectToSend, SetFullStateObject, SetUpdatePacketCallback, NewPlayerCallback, PlayerLeftCallback, SendJson }