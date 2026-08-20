'use strict';
import { RTCPeer } from './webRtcWrapper.js';


const SendMessages = Object.freeze({
    INIT: 'init',
    CREATE_SERVER: 'CreateServer',
    JOIN_SERVER: 'JoinServer',
    LIST_SERVERS: 'ListServers',
    ICE_OFFER: 'SendIceSDF',
    ICE_CANDIDATE: 'SendIceCandidate',
    RELAY: 'relay',
});


const ReceiveMessages = Object.freeze({
    ACTIVE: 'ACTIVE',
    ERROR: 'ERROR',
    NEW_CONNECTION: 'newPeer',
    ICE_OFFER: 'ReceiveIceSDF',
    ICE_CANDIDATE: 'ReceiveIceCandidate',
    RELAY: 'relay',
});

class UUID {
    constructor() {
        this.array = new Uint8Array(4);
        crypto.getRandomValues(this.array);
        this.ID = parseInt(this.array.join(''), 10);
    }
}

const DEFAULT_SIGNAL_PORT = 8088;

function getSignalServerUrl() {
    const override = typeof window !== 'undefined' && window.__GAME_SIGNAL_URL__ ? window.__GAME_SIGNAL_URL__ : null;
    if (override) return override;

    const isSecure = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : 'localhost';
    const port = typeof window !== 'undefined' && window.__GAME_SIGNAL_PORT__ ? window.__GAME_SIGNAL_PORT__ : DEFAULT_SIGNAL_PORT;

    return `${isSecure ? 'wss:' : 'ws:'}//${hostname}:${port}`;
}

class ServerNetwork {
    /**
     * @param {UUID} myId 
     */
    constructor(myId) {
        this.MyId = myId;
        /**
         * @type {Object.<string, RTCPeer>}
         */
        this.Connections = {}
        this.receiveDataFromPlayer = (data, from, isBinary) => { }
        this.headerLength = 8; // 4 bytes for from id, 4 to id

        this.socket = new WebSocket(getSignalServerUrl()); // wss://

        // Change binary type from "blob" to "arraybuffer" to receive binary data as ArrayBuffer
        // keeps data in memory and modifiable
        this.socket.binaryType = "arraybuffer";

        this.isReady = new Promise((resolve, reject) => {
            this.socket.onopen = (event) => {
                this.socket.send(JSON.stringify({ MyId: this.MyId.ID, TYPE: SendMessages.INIT }));
                resolve();
            };
        });
        

        this.socket.onmessage = (event) => {
            if (this.isBinary(event.data)) {
                let z = new Uint32Array(event.data);
                // console.log('received:', event.data.byteLength, ' bytes binary data', event.data, z);
                this.receiveDataFromPlayer(event.data, z[1], true);
            }else{
                let data = JSON.parse(event.data);

                switch (data.TYPE) {
                    case ReceiveMessages.ACTIVE:
                        this.activeResponse(data.data);
                        break;
                    case ReceiveMessages.ERROR:
                        this.errorResponse(data.message);
                        break;
                    case ReceiveMessages.NEW_CONNECTION:
                        // this.newConnection(data.FROM);
                        break;
                    case ReceiveMessages.ICE_OFFER:
                        this.receiveOffer(data.FROM, data.data);
                        break;
                    case ReceiveMessages.ICE_CANDIDATE:
                        this.receiveCandidate(data.FROM, data.data);
                        break;
                    case ReceiveMessages.RELAY:
                        this.receiveDataFromPlayer(data.data, data.FROM, false);
                        break;
                    default:
                        console.log("Unknown " + data.TYPE, data)
                        break;
                }
            }

        };

        this.activeResponse = (data) => { };
        this.errorResponse = (data) => { };
    }

    isBinary(value) {
        return value && value instanceof ArrayBuffer && value.byteLength !== undefined;
    }

    async getActiveServers() {
        // let resp = await fetch("ActiveServers", { method: "GET" })
        // let body = await resp.json()
        // console.log(body)
    }

    // appendBuffer(buffer1, buffer2) {
    //     var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    //     tmp.set(new Uint8Array(buffer1), 0);
    //     tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    //     return tmp.buffer;
    // }
    //Content-type: application/json
    async CreateServer(serverName) {
        let request = { MyId: this.MyId.ID, TYPE: SendMessages.CREATE_SERVER, ServerName: serverName };
        this.socket.send(JSON.stringify(request))

        // var enc = new TextEncoder(); // always utf-8
        // let dat = enc.encode(this.MyId); //[0XE6].concat(
        // var blob = new Blob([[0XE6], dat])
        // console.log(new Uint8Array([0XE6]))

        // let buf = this.appendBuffer(new Uint8Array([0XE6]), this.MyId.array)
        // this.socket.send(buf)
        return new Promise((resolve, reject) => {
            this.activeResponse = (data) => { resolve(data) };
            this.errorResponse = (data) => { reject(data) };
        });

    }

    async ListServers() {
        let request = { MyId: this.MyId.ID, TYPE: SendMessages.LIST_SERVERS };
        this.socket.send(JSON.stringify(request))
        return new Promise((resolve, reject) => {
            this.activeResponse = (data) => { resolve(data) };
            this.errorResponse = (data) => { reject(data) };
        });
    }

    async JoinServer(serverName) {
        let request = { MyId: this.MyId.ID, TYPE: SendMessages.JOIN_SERVER, ServerName: serverName };
        this.socket.send(JSON.stringify(request))
        return new Promise((resolve, reject) => {
            this.activeResponse = (data) => {
                if (data.Host && data.Host != this.MyId.ID) {
                    this.newConnection(data.Host);
                }
                for (const remoteId of data.Players) {
                    if (remoteId != this.MyId.ID) {
                        this.newConnection(remoteId);
                    }
                }
                resolve(data)
            };
            this.errorResponse = (data) => {
                if (data == "Already in server") {
                    resolve(data)
                } else {
                    reject(data)
                }
            };
        });
    }

    relayOffer(toId, offer) {
        // console.log("offer to ", toId)
        let request = { MyId: this.MyId.ID, TYPE: SendMessages.ICE_OFFER, TO: toId, data: offer };
        this.socket.send(JSON.stringify(request))
    }

    relayCandidate(toId, candidate) {
        // console.log("ice to ", toId, candidate)
        let request = { MyId: this.MyId.ID, TYPE: SendMessages.ICE_CANDIDATE, TO: toId, data: candidate };
        this.socket.send(JSON.stringify(request))
    }

    receiveOffer(fromId, offer) {
        // console.log("offer from ", fromId, offer)
        if (!this.Connections[fromId]) {
            const network = new RTCPeer(this.MyId.ID, fromId, this)
            network.AcceptRemote(offer);
            network.receivedData = (data, isBinary) => { this.receiveDataFromPlayer(data, fromId, isBinary) };
            this.Connections[fromId] = network;
        } else {
            this.Connections[fromId].RemoteOffer(offer)
        }
    }

    receiveCandidate(fromId, candidate) {
        // console.log("ice from ", fromId, candidate)
        this.Connections[fromId].addRemoteICE(candidate)
    }

    newConnection(fromId) {
        const network = new RTCPeer(this.MyId.ID, fromId, this)
        network.FindIce();
        network.receivedData = (data, isBinary) => { this.receiveDataFromPlayer(data, fromId, isBinary) };
        this.Connections[fromId] = network;
    }

    async LeaveServer() {
        // let request = { MyId: this.MyId }
        // let resp = await fetch("LeaveServer", {
        //     method: "POST", headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify(request),
        // })
        // let body = await resp.json()
        // return body;
        // console.log(body)
    }

    sendToPlayers(data, asBinary = false) {
        for (const key in this.Connections) {
            if (Object.prototype.hasOwnProperty.call(this.Connections, key)) {
                const connection = this.Connections[key];
                let sendData;

                if (asBinary) {
                    if (connection.WebRtcFailed) {
                        var array1 = new Uint32Array([key, this.MyId.ID]);
                        data = new Blob([array1, data])
                    }
                    sendData = data; // should be ArrayBuffer
                }else{
                    let request = data;
                    if (connection.WebRtcFailed) {
                        request = { MyId: this.MyId.ID, TYPE: SendMessages.RELAY, TO: key, data: data };
                    }
                    sendData = JSON.stringify(request);
                }

                
                if (connection.WebRtcFailed) {
                    this.socket.send(sendData) // data: string | Blob | ArrayBuffer | TypedArray or a DataView
                }else{
                    connection.sendData(sendData); // data: string | Blob | ArrayBuffer | TypedArray or a DataView
                }
            }
        }
    }
}
export { ServerNetwork, UUID };