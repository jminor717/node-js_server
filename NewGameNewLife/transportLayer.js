let clients = {};

const MAX_CHUNK_SIZE = 262144;
let WaitForNetwork, NetworkFoundResolve, NetworkFoundReject;

let IsServer = false, FoundServer = false, ReadyToSend = false;

let OpenCallback = null, ReceiveCallback = null, CloseCallback = null, becomeServerCallback = null;

const ClientID = Math.floor(Math.random() * Math.pow(2, 22))

const signaling = new BroadcastChannel('webrtc');
signaling.onmessage = e => {
    console.log(e, e.data);
    // if (!localStream) {
    //     console.log('not ready yet');
    //     return;
    // }
    switch (e.data.type) {
        case 'offer':
            // FoundServer = true;
            handleOffer(e.data);
            break;
        case 'answer':
            // if (FoundServer) {
            //     console.log('not the server, ignoring');
            //     return;
            // }
            handleAnswer(e.data);
            break;
        case 'candidate':
            // if (FoundServer) {
            //     console.log('not the server, ignoring');
            //     return;
            // }
            handleCandidate(e.data);
            break;
        case 'ready':
            // A second tab joined. This tab will initiate a call unless in a call already.
            // if (FoundServer && Object.keys(clients).length > 0) {
            //     console.log('not the server, ignoring');
            //     return;
            // }
            FoundServer = false;
            console.log("becoming server")
            IsServer = true;
            if (becomeServerCallback) {
                becomeServerCallback();
            }
            makeCall(e.data);
            break;
        // case 'bye':
        //     if (pc) {
        //         hangup();
        //     }
        //     break;
        default:
            console.log('unhandled', e);
            break;
    }
};

async function makeCall(data) {
    await createPeerConnection(data);

    const offer = await clients[data.ClientID].pc.createOffer();
    signaling.postMessage({ type: 'offer', sdp: offer.sdp, ClientID: ClientID });
    await clients[data.ClientID].pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
    if (clients[offer.ClientID]?.pc) {
        console.error('existing peerconnection');
        return;
    }
    await createPeerConnection(offer);
    await clients[offer.ClientID].pc.setRemoteDescription(offer);

    const answer = await clients[offer.ClientID].pc.createAnswer();
    signaling.postMessage({ type: 'answer', sdp: answer.sdp, ClientID: ClientID });
    await clients[offer.ClientID].pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
    if (!clients[answer.ClientID]?.pc) {
        console.error('no peerconnection');
        return;
    }
    await clients[answer.ClientID].pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
    if (!clients[candidate.ClientID]?.pc) {
        console.error('no peerconnection');
        return;
    }
    // console.log(candidate);
    if (!candidate.candidate) {
        await clients[candidate.ClientID].pc.addIceCandidate(null);
    } else {
        await clients[candidate.ClientID].pc.addIceCandidate(candidate);
    }
}

function createPeerConnection(data) {
    clients[data.ClientID] = {};
    clients[data.ClientID].pc = new RTCPeerConnection();
    clients[data.ClientID].sendInterval = null;
    clients[data.ClientID].receiveChannel = null;
    clients[data.ClientID].sendChannel = null;
    clients[data.ClientID].ReadyState = null;
    clients[data.ClientID].ReadyToSend = false;
    clients[data.ClientID].OpenCallbackCalled = false;
    clients[data.ClientID].CachedCandidate = {}

    clients[data.ClientID].pc.onicecandidate = e => {
        const message = {
            type: 'candidate',
            candidate: null,
            ClientID: ClientID
        };
        if (e.candidate) {
            // console.log(e);
            clients[data.ClientID].CachedCandidate = e.candidate;

            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }else{
            console.log("bad event", e, clients[data.ClientID].CachedCandidate);
            message.candidate = clients[data.ClientID].CachedCandidate.candidate;
            message.sdpMid = clients[data.ClientID].CachedCandidate.sdpMid;
            message.sdpMLineIndex = clients[data.ClientID].CachedCandidate.sdpMLineIndex;
        }
        signaling.postMessage(message);
    };
    const dataChannelParams = { ordered: false };
    clients[data.ClientID].pc.addEventListener('datachannel', (event) => { receiveChannelCallback(event, data.ClientID) });
    clients[data.ClientID].sendChannel = clients[data.ClientID].pc.createDataChannel('sendDataChannel', dataChannelParams);
    clients[data.ClientID].sendChannel.addEventListener('open', onSendChannelOpen.bind(this, data.ClientID));
    clients[data.ClientID].sendChannel.addEventListener('close', onSendChannelClosed.bind(this, data.ClientID));
    console.log('Created send data channel: ', clients[data.ClientID].sendChannel);
    // pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
    // localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

function onSendChannelClosed(id) {
    console.log('Send channel is closed');
    clients[id].pc.close();
    if (CloseCallback){
        CloseCallback(id);
    }
    delete clients[id];
}

function onReceiveChannelClosed(id) {
    console.log('Receive channel is closed');
    clients[id].pc.close();
    delete clients[id];
    console.log('Closed remote peer connection');
    // maybeReset();
}



function onSendChannelOpen(id) {
    console.log('Send channel is open');
    clients[id].ReadyState = "AmReady";
    clients[id].sendInterval = setInterval(async () => {
        if (clients[id].ReadyState === "done") {
            clearInterval(clients[id].sendInterval);
            return;
        } else {
            // console.log("-------------------", clients[id].ReadyState);
            clients[id].sendChannel.send(clients[id].ReadyState);
        }
    }, 1000);
}



function SetNetworkReady(id) {
    ReadyToSend = true;
    NetworkFoundResolve(true);
    if (OpenCallback && !clients[id].OpenCallbackCalled) {
        // clients[id].OpenCallbackCalled = true;
        OpenCallback();
    }
    clients[id].ReadyToSend = true;
}


function onReceiveMessageCallback(event, id) {
    // console.log('Current Throughput is:', event.data.length, 'bytes/sec');
    
    if (ReceiveCallback) {
        // if (IsServer) {
        //     for (const key in clients) {
        //         if (key != id && Object.hasOwnProperty.call(clients, key)) {
        //             const element = clients[key];
        //             if (element.ReadyToSend) {
        //                 // console.log("-----------senddd--------", event.data);
        //                 element.sendChannel.send(event.data);
        //             }
        //         }
        //     }
        // }
        ReceiveCallback(event, id);
    }
    if (event.data === "AmReady") {
        clients[id].ReadyState = "AcknowledgeReady"
    }
    if (event.data === "AcknowledgeReady") {
        clients[id].ReadyState = "done"
        // console.log("-----------se--------", event.data);
        clients[id].sendChannel.send(clients[id].ReadyState);
        clearInterval(clients[id].sendInterval);
        SetNetworkReady(id);
    }
    if (event.data === "done") {
        clearInterval(clients[id].sendInterval);
        SetNetworkReady(id);
    }

    // Workaround for a bug in Chrome which prevents the closing event from being raised by the
    // remote side. Also a workaround for Firefox which does not send all pending data when closing
    // the channel.
    // if (receiveProgress.value === receiveProgress.max) {
    //     clients[id].sendChannel.close();
    //     clients[id].receiveChannel.close();
    // }
}




function receiveChannelCallback(event, id) {
    console.log(id, event);
    console.log('Receive Channel Callback');
    clients[id].receiveChannel = event.channel;
    clients[id].receiveChannel.binaryType = 'arraybuffer';
    // receiveChannel.addEventListener('close', onReceiveChannelClosed);
    clients[id].receiveChannel.addEventListener('message', (msgEvt) => onReceiveMessageCallback(msgEvt, id));
}




async function ContactServer() {
    // git clone https://github.com/webrtc/samples.git
    // check the server to see if there are any active offers
    // if not
    //      create a RTCPeerConnection
    //      set up listeners and createOffer then send that offer to the server
    //      wait for the server to send an answer arrives use it to setRemoteDescription
    // if there are active offers
    //      create a RTCPeerConnection
    //      set up listeners and setRemoteDescription based to the connection from the server
    //      create answer and send to Server
    // this should be duplicated to create 2 way communication
    // localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

    WaitForNetwork = new Promise(function (resolve, reject) {
        NetworkFoundResolve = resolve;
        NetworkFoundReject = reject;
    });
    setTimeout(() => NetworkFoundReject("timeout ll"), 10000)
    //  signaling.postMessage({ type: 'ready', ClientID: ClientID });
}

function sendData(data) {
    signaling.postMessage(data);
    // signaling.postMessage({ type: 'ready', ClientID: ClientID });

    // for (const key in clients) {
    //     if (Object.hasOwnProperty.call(clients, key)) {
    //         const element = clients[key];
    //         if (element.ReadyToSend) {
    //             element.sendChannel.send(data);
    //         }
    //     }
    // }

}

function SetDataReceivedCallback(cb) {
    ReceiveCallback = cb;
    // receiveChannel.addEventListener('message', cb);
}

function addSendChannelReadyCallback(cb) {
    OpenCallback = cb;
    // sendChannel.addEventListener('open', cb);
}

function addSendChannelCloseCallback(cb) {
    CloseCallback = cb;
    // sendChannel.addEventListener('open', cb);
}

function addServerChangedCallback(cb) {
    becomeServerCallback = cb;
    // sendChannel.addEventListener('open', cb);
}

export {
    signaling,
    ContactServer,
    WaitForNetwork,
    sendData,
    SetDataReceivedCallback,
    addSendChannelReadyCallback,
    addSendChannelCloseCallback,
    addServerChangedCallback,
    ReadyToSend,
    IsServer, 
    ClientID as MyClientID
}