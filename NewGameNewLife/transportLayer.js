let pc;
let sendChannel, receiveChannel, sendCount = 0, sendInterval;
const MAX_CHUNK_SIZE = 262144;
let WaitForNetwork, NetworkFoundResolve, NetworkFoundReject;

let ReadyToSend = false;

let OpenCallback = null, ReceiveCallback = null;

const signaling = new BroadcastChannel('webrtc');
signaling.onmessage = e => {
    // console.log(e, e.data);
    // if (!localStream) {
    //     console.log('not ready yet');
    //     return;
    // }
    switch (e.data.type) {
        case 'offer':
            handleOffer(e.data);
            break;
        case 'answer':
            handleAnswer(e.data);
            break;
        case 'candidate':
            handleCandidate(e.data);
            break;
        case 'ready':
            // A second tab joined. This tab will initiate a call unless in a call already.
            if (pc) {
                console.log('already in call, ignoring');
                return;
            }
            makeCall();
            break;
        case 'bye':
            if (pc) {
                hangup();
            }
            break;
        default:
            console.log('unhandled', e);
            break;
    }
};

async function makeCall() {
    await createPeerConnection();

    const offer = await pc.createOffer();
    signaling.postMessage({ type: 'offer', sdp: offer.sdp });
    await pc.setLocalDescription(offer);
}

async function handleOffer(offer) {
    if (pc) {
        console.error('existing peerconnection');
        return;
    }
    await createPeerConnection();
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    signaling.postMessage({ type: 'answer', sdp: answer.sdp });
    await pc.setLocalDescription(answer);
}

async function handleAnswer(answer) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    await pc.setRemoteDescription(answer);
}

async function handleCandidate(candidate) {
    if (!pc) {
        console.error('no peerconnection');
        return;
    }
    if (!candidate.candidate) {
        await pc.addIceCandidate(null);
    } else {
        await pc.addIceCandidate(candidate);
    }
}

let ReadyState;

function onSendChannelOpen() {
    console.log('Send channel is open');
    ReadyState = "AmReady";
    sendInterval = setInterval(async () => {
        if (ReadyState === "done") {
            clearInterval(sendInterval);
            return;
        }else{
            console.log("-------------------", ReadyState);
            sendChannel.send(ReadyState);
        }
    }, 1000);
}

function onSendChannelClosed() {
    console.log('Send channel is closed');
    pc.close();
    pc = null;
    ReadyToSend = false;
}

function SetNetworkReady(){
    ReadyToSend = true;
    NetworkFoundResolve(true);
    if (OpenCallback) {
        OpenCallback();
    }
}


function onReceiveMessageCallback(event) {
    if (ReceiveCallback) {
        ReceiveCallback(event);
    }
    // console.log('Current Throughput is:', event.data.length, 'bytes/sec');
    if (event.data === "AmReady"){
        ReadyState = "AcknowledgeReady"
    }
    if (event.data === "AcknowledgeReady") {
        ReadyState = "done"
        sendChannel.send(ReadyState);
        clearInterval(sendInterval);
        SetNetworkReady();
    }
    if (event.data === "done"){
        clearInterval(sendInterval);
        SetNetworkReady();
    }

    // Workaround for a bug in Chrome which prevents the closing event from being raised by the
    // remote side. Also a workaround for Firefox which does not send all pending data when closing
    // the channel.
    // if (receiveProgress.value === receiveProgress.max) {
    //     sendChannel.close();
    //     receiveChannel.close();
    // }
}

function onReceiveChannelClosed() {
    console.log('Receive channel is closed');
    pc.close();
    pc = null;
    console.log('Closed remote peer connection');
    // maybeReset();
}


function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.binaryType = 'arraybuffer';
    // receiveChannel.addEventListener('close', onReceiveChannelClosed);
    receiveChannel.addEventListener('message', onReceiveMessageCallback);
}


function createPeerConnection() {
    pc = new RTCPeerConnection();
    pc.onicecandidate = e => {
        const message = {
            type: 'candidate',
            candidate: null,
        };
        if (e.candidate) {
            message.candidate = e.candidate.candidate;
            message.sdpMid = e.candidate.sdpMid;
            message.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        signaling.postMessage(message);
    };
    const dataChannelParams = { ordered: false };
    pc.addEventListener('datachannel', receiveChannelCallback);
    sendChannel = pc.createDataChannel('sendDataChannel', dataChannelParams);
    sendChannel.addEventListener('open', onSendChannelOpen);
    sendChannel.addEventListener('close', onSendChannelClosed);
    console.log('Created send data channel: ', sendChannel);
    // pc.ontrack = e => remoteVideo.srcObject = e.streams[0];
    // localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

var ObjectId;

async function ContactServer(obj) {
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

    ObjectId = obj;

    WaitForNetwork = new Promise(function (resolve, reject) {
        NetworkFoundResolve = resolve;
        NetworkFoundReject = reject;
    });
    setTimeout(() => NetworkFoundReject(), 5000)
    signaling.postMessage({ type: 'ready' });
}

function sendData(data){
    if (ReadyToSend) {
        sendChannel.send(data);
    }
}

function SetDataReceivedCallback(cb){
    ReceiveCallback = cb;
    // receiveChannel.addEventListener('message', cb);
}

function addSendChannelReadyCallback(cb){
    OpenCallback = cb;
    // sendChannel.addEventListener('open', cb);
}

export { signaling, ContactServer, WaitForNetwork, sendData, SetDataReceivedCallback, addSendChannelReadyCallback, ReadyToSend }