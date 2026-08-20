'use strict';
import { ServerNetwork, UUID } from './serverNetworking.js';

const DEFAULT_ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

function getIceConfig() {
    const customIceServers = typeof window !== 'undefined' && Array.isArray(window.__GAME_ICE_SERVERS__)
        ? window.__GAME_ICE_SERVERS__
        : null;

    return {
        iceServers: customIceServers && customIceServers.length ? customIceServers : DEFAULT_ICE_SERVERS,
        iceTransportPolicy: 'all',
        iceCandidatePoolSize: 0,
    };
}

const servers = getIceConfig();


class RTCPeer {
    /**
     * 
     * @param {UUID} myId 
     * @param {string} remoteId 
     * @param {ServerNetwork} server 
     */
    constructor(myId, remoteId, server) {
        this.MyId = myId;
        this.RemoteId = remoteId;
        // console.log("webRtc for: ", this.MyId, " remote: ", this.RemoteId)
        this.Server = server;
        this.localConnection;
        /** @type {RTCDataChannel} */
        this.sendChannel;
        this.candidates = [];
        this.hasRemote = false;

        this.receivedData = (data, isBinary) => {};
        this.WebRtcFailed = false;
        this.Connected = false;

        this.readyToSend = () => {};
    }




    onReceiveMessageCallback(event) {
         console.log('Received Message', event);

        const payload = event.data;
        if (typeof payload === 'string') {
            console.log('Received string', event.data);
            this.receivedData(payload, false);
            return;
        }

        if (payload instanceof ArrayBuffer) {
            console.log('Received ArrayBuffer', event.data);
            this.receivedData(payload, true);
            return;
        }

        if (payload instanceof Blob) {
            console.log('Received Blob', event.data);
            payload.arrayBuffer().then((buffer) => this.receivedData(buffer, true)).catch((error) => {
                console.error('Failed to read binary payload', error);
            });
            return;
        }

        if (payload instanceof Uint8Array) {
            console.log('Received Uint8Array', event.data);
            this.receivedData(payload.buffer, true);
            return;
        }

        console.log('Received ?', event);

        this.receivedData(payload, false);
    }

    sendData(data){
        if (this.Connected && this.sendChannel && this.sendChannel.readyState === "open") {
            this.sendChannel.send(data)
        }
    }


    /**
     * setup by first client
     */
    FindIce() {
        this.localConnection = new RTCPeerConnection(servers);
        // this.localConnection.addEventListener('datachannel', (event) => { console.log("data chan", event) });
        console.log(this.MyId, 'Created local peer connection object localConnection', this.RemoteId);

        this.localConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.localConnection.iceConnectionState);
        };
        this.localConnection.onconnectionstatechange = () => {
            console.log('Peer connection state:', this.localConnection.connectionState);
        };

        this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');
        this.sendChannel.onopen = (event) => this.onSendChannelStateChange(event);
        this.sendChannel.onclose = (event) => this.onSendChannelStateChange(event);
        this.sendChannel.onmessage = (event) => this.onReceiveMessageCallback(event);
        

        this.localConnection.onicecandidate = e => { this.Server.relayCandidate(this.RemoteId, e.candidate) };

        const gotDescription = (desc) => {
            this.localConnection.setLocalDescription(desc);
            this.Server.relayOffer(this.RemoteId, desc)
        }

        this.localConnection.createOffer().then(gotDescription, this.onCreateSessionDescriptionError);

    }

    /**
     * 
     * @param {*} desc 
     */
    RemoteOffer(desc) {
        // console.log("got desc ", desc)
        this.localConnection.setRemoteDescription(desc);
        this.flushIce();
        setTimeout(() => {
            if (this.sendChannel.readyState == "connecting") {
                this.WebRtcFailed = true;
                console.log("WebRTC failed", this.sendChannel);
                this.readyToSend();
            }
        }, 5000)
    }

    /**
     * setup by second client using offer created in setup of first client
     */
    AcceptRemote(offer) {
        this.localConnection = new RTCPeerConnection(servers);
        console.log(this.MyId, 'Created _remote_ peer connection object localConnection', this.RemoteId);
        // this.localConnection.addEventListener('datachannel', (event) => { console.log("data chan", event) });

        this.localConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', this.localConnection.iceConnectionState);
        };
        this.localConnection.onconnectionstatechange = () => {
            console.log('Peer connection state:', this.localConnection.connectionState);
        };

        this.localConnection.onicecandidate = e => {
            this.Server.relayCandidate(this.RemoteId, e.candidate)
        };

        const gotDescription = (desc) => {
            this.localConnection.setLocalDescription(desc);
            this.Server.relayOffer(this.RemoteId, desc);
            this.flushIce();
        }

        this.localConnection.setRemoteDescription(offer);
        this.localConnection.createAnswer().then(gotDescription, this.onCreateSessionDescriptionError);

        this.localConnection.ondatachannel = (event) => this.receiveChannelCallback(event);

        setTimeout(() => {
            if (this.sendChannel == null || this.sendChannel.readyState == "connecting") {
                this.WebRtcFailed = true;
                console.log("WebRTC failed", this.sendChannel)
                this.readyToSend();
            }
        }, 5000)
    }

    receiveChannelCallback(event) {
        // console.log('Receive Channel Callback', event);
        this.sendChannel = event.channel;
        this.sendChannel.onmessage = (event) => this.onReceiveMessageCallback(event);
        this.sendChannel.onopen = (event) => this.onSendChannelStateChange(event);
        this.sendChannel.onclose = (event) => this.onSendChannelStateChange(event);
    }

    addRemoteICE(candidate) {
        if (this.hasRemote) { this.addIceInternal(candidate); }
        else { this.candidates.push(candidate); }
    }

    flushIce() {
        this.hasRemote = true;
        for (const can of this.candidates) { this.addIceInternal(can); }
        this.candidates = [];
    }

    addIceInternal(candidate) {
        this.localConnection.addIceCandidate(candidate).then(this.onAddIceCandidateSuccess, this.onAddIceCandidateError);
        // console.log(`ICE candidate: ${candidate ? candidate.candidate : '(null)'}`);
    }

    onAddIceCandidateSuccess() { }//console.log('AddIceCandidate success.'); }
    onAddIceCandidateError(error) { console.log(`Failed to add Ice Candidate: ${error.toString()}`); }
    onCreateSessionDescriptionError(error) { console.log('Failed to create session description: ' + error.toString()); }

    onSendChannelStateChange(ev) {
        const readyState = this.sendChannel.readyState;
        console.log('Send channel state is: ' + readyState, ev);
        if (readyState == "open") {
            this.Connected = true;
            this.readyToSend();
            // this.sendChannel.send("oh hi")
        }
    }
}

export { RTCPeer };
