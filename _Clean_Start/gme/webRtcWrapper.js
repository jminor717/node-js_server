'use strict';
import { ServerNetwork } from './serverNetworking.js';

const servers = null;


class RTCPeer {
    /**
     * 
     * @param {string} myId 
     * @param {string} remoteId 
     * @param {ServerNetwork} server 
     */
    constructor(myId, remoteId, server) {
        this.MyId = myId;
        this.RemoteId = remoteId;
        console.log("webRtc for: ", this.MyId, " remote: ", this.RemoteId)
        this.Server = server;
        this.localConnection;
        this.sendChannel;
        this.candidates = [];
        this.hasRemote = false;
    }

    // https://webrtc.github.io/samples/src/content/datachannel/channel/
    // docs
    FindIce() {
        this.localConnection = new RTCPeerConnection(servers);
        this.localConnection.addEventListener('datachannel', (event) => { console.log("data chan", event) });

        console.log('Created local peer connection object localConnection', this.RemoteId);

        this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');
        // console.log('Created send data channel');

        this.localConnection.onicecandidate = e => {
            // console.log("&&&", this.RemoteId, e.candidate)
            this.Server.relayCandidate(this.RemoteId, e.candidate)
            // remote.addIceCandidate(event.candidate)
            // onIceCandidate(this.localConnection, e);
        };

        const gotDescription = (desc) => {
            this.localConnection.setLocalDescription(desc);
            this.Server.relayOffer(this.RemoteId, desc)
        }

        this.localConnection.createOffer().then(gotDescription, this.onCreateSessionDescriptionError);
        this.localConnection.onnegotiationneeded = (event) => { console.log("TTTTTTTTTTT", event) }

    }



    RemoteOffer(desc) {
        console.log("got desc ", desc)

        // const gotDescription = (desc) => {
        //     this.Server.relayOffer(this.RemoteId, desc)
        // }
        this.localConnection.setRemoteDescription(desc);
        this.flushIce();
        setTimeout(() => {
            this.sendChannel = this.localConnection.createDataChannel('sendDataChannel2');
            this.sendChannel.onopen = this.onSendChannelStateChange;
            this.sendChannel.onclose = this.onSendChannelStateChange;
        },1000)
        // this.localConnection.createAnswer().then(
        //     gotDescription,
        //     this.onCreateSessionDescriptionError
        // );
    }

    AcceptRemote(offer) {
        this.localConnection = new RTCPeerConnection(servers);
        console.log('Created _remote_ peer connection object localConnection', this.RemoteId);
        this.localConnection.addEventListener('datachannel', (event) => { console.log("data chan", event) });

        // this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');

        this.localConnection.onicecandidate = e => {
            // console.log("&&&", this.RemoteId, e.candidate)
            this.Server.relayCandidate(this.RemoteId, e.candidate)
            // remote.addIceCandidate(event.candidate)
            // onIceCandidate(this.localConnection, e);
        };
        // this.sendChannel.onopen = this.onSendChannelStateChange;
        // this.sendChannel.onclose = this.onSendChannelStateChange;



        const gotDescription = (desc) => {
            this.localConnection.setLocalDescription(desc);
            this.Server.relayOffer(this.RemoteId, desc);
            this.flushIce();
        }

        this.localConnection.setRemoteDescription(offer);
        this.localConnection.createAnswer().then(
            gotDescription,
            this.onCreateSessionDescriptionError
        );

        this.localConnection.ondatachannel = receiveChannelCallback;

        this.localConnection.onnegotiationneeded =(event) => {console.log("________",event)}
    }

    receiveChannelCallback(event) {
        console.log('Receive Channel Callback');
        this.sendChannel = event.channel;
        this.sendChannel.onmessage = this.onReceiveMessageCallback;
        this.sendChannel.onopen = this.onSendChannelStateChange;
        this.sendChannel.onclose = this.onSendChannelStateChange;
    }

    onReceiveMessageCallback(event) {
        console.log('Received Message', event);
        //todo receive Data   event.data
    }

    addRemoteICE(candidate) {
        if (this.hasRemote) {
            this.addIceInternal(candidate);
        }
        else{
            this.candidates.push(candidate)
        }
    }

    flushIce(){
        this.hasRemote = true;
        for (const can of this.candidates) {
            this.addIceInternal(can);
        }
        this.candidates = [];
    }

    addIceInternal(candidate){
        this.localConnection.addIceCandidate(candidate)
            .then(
                this.onAddIceCandidateSuccess,
                this.onAddIceCandidateError
            );
        console.log(`ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
    }

    onAddIceCandidateSuccess() {
        console.log('AddIceCandidate success.');
    }

    onAddIceCandidateError(error) {
        console.log(`Failed to add Ice Candidate: ${error.toString()}`);
    }

    onCreateSessionDescriptionError(error) {
        console.log('Failed to create session description: ' + error.toString());
    }

    onSendChannelStateChange() {
        const readyState = this.sendChannel.readyState;
        console.log('Send channel state is: ' + readyState);
    }
}

export { RTCPeer };

// start
function createConnection() {
    window.remoteConnection = remoteConnection = new RTCPeerConnection(servers);
    console.log('Created remote peer connection object remoteConnection');

    remoteConnection.onicecandidate = e => {
        onIceCandidate(remoteConnection, e);
    };
    remoteConnection.ondatachannel = receiveChannelCallback;


}


function sendData(data) {
    sendChannel.send(data);
    console.log('Sent Data: ' + data);
}

function closeDataChannels() {
    console.log('Closing data channels');
    sendChannel.close();
    console.log('Closed data channel with label: ' + sendChannel.label);
    receiveChannel.close();
    console.log('Closed data channel with label: ' + receiveChannel.label);
    localConnection.close();
    remoteConnection.close();
    localConnection = null;
    remoteConnection = null;
    console.log('Closed peer connections');
}

function gotDescription1(desc) {
    localConnection.setLocalDescription(desc);
    console.log(`Offer from localConnection\n${desc.sdp}`);
    remoteConnection.setRemoteDescription(desc);
    remoteConnection.createAnswer().then(
        gotDescription2,
        onCreateSessionDescriptionError
    );
}

function gotDescription2(desc) {
    remoteConnection.setLocalDescription(desc);
    console.log(`Answer from remoteConnection\n${desc.sdp}`);
    localConnection.setRemoteDescription(desc);
}

function getOtherPc(pc) {
    return (pc === localConnection) ? remoteConnection : localConnection;
}

function getName(pc) {
    return (pc === localConnection) ? 'localPeerConnection' : 'remotePeerConnection';
}

function onIceCandidate(pc, event) {
    getOtherPc(pc)
        .addIceCandidate(event.candidate)
        .then(
            onAddIceCandidateSuccess,
            onAddIceCandidateError
        );
    console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function onAddIceCandidateSuccess() {
    console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
    console.log(`Failed to add Ice Candidate: ${error.toString()}`);
}

function receiveChannelCallback(event) {
    console.log('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
    console.log('Received Message');
    //todo receive Data   event.data
}

function onReceiveChannelStateChange() {
    const readyState = receiveChannel.readyState;
    console.log(`Receive channel state is: ${readyState}`);
}