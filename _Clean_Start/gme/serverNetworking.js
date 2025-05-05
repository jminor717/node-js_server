'use strict';
import { RTCPeer } from './webRtcWrapper.js';


const SendMessages = Object.freeze({
    INIT: 'init',
    CREATE_SERVER: 'CreateServer',
    JOIN_SERVER: 'JoinServer',
    ICE_OFFER: 'SendIceSDF',
    ICE_CANDIDATE: 'SendIceCandidate',
});


const ReceiveMessages = Object.freeze({
    ACTIVE: 'ACTIVE',
    ERROR: 'ERROR',
    NEW_CONNECTION: 'newPeer',
    ICE_OFFER: 'ReceiveIceSDF',
    ICE_CANDIDATE: 'ReceiveIceCandidate',
});

class ServerNetwork {
    constructor(myId) {
        this.MyId = myId;
        this.Connections = {}

        this.socket = new WebSocket("ws://localhost:8080"); // wss://
        this.isReady = new Promise((resolve, reject) => {
            this.socket.onopen = (event) => {
                console.log(event)
                this.socket.send(JSON.stringify({ MyId: this.MyId, TYPE: SendMessages.INIT }));
                resolve();
            };
        });

        this.socket.onmessage = (event) => {
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
                default:
                    console.log("Unknown " + data.TYPE, data)
                    break;
            }
        };

        this.activeResponse = (data) => { };
        this.errorResponse = (data) => { };
    }



    async getActiveServers() {
        // let resp = await fetch("ActiveServers", { method: "GET" })
        // let body = await resp.json()
        // console.log(body)
    }
    //Content-type: application/json
    async CreateServer(serverName) {
        let request = { MyId: this.MyId, TYPE: SendMessages.CREATE_SERVER, ServerName: serverName };
        this.socket.send(JSON.stringify(request))
        return new Promise((resolve, reject) => {
            this.activeResponse = (data) => { resolve(data) };
            this.errorResponse = (data) => { reject(data) };
        });
    }

    async JoinServer(serverName) {
        let request = { MyId: this.MyId, TYPE: SendMessages.JOIN_SERVER, ServerName: serverName };
        this.socket.send(JSON.stringify(request))
        return new Promise((resolve, reject) => {
            this.activeResponse = (data) => {
                console.log(data)
                if (data.Host && data.Host != this.MyId) {
                    this.newConnection(data.Host);
                }
                for (const remoteId of data.Players) {
                    if (remoteId != this.MyId) {
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
        console.log("offer to ", toId)
        let request = { MyId: this.MyId, TYPE: SendMessages.ICE_OFFER, TO: toId, data: offer };
        this.socket.send(JSON.stringify(request))
    }

    relayCandidate(toId, candidate) {
        // console.log("ice to ", toId, candidate)
        let request = { MyId: this.MyId, TYPE: SendMessages.ICE_CANDIDATE, TO: toId, data: candidate };
        this.socket.send(JSON.stringify(request))
    }

    receiveOffer(fromId, offer) {
        console.log("offer from ", fromId, offer)
        if (!this.Connections[fromId]) {
            const network = new RTCPeer(this.MyId, fromId, this)
            network.AcceptRemote(offer);
            this.Connections[fromId] = network;
        }else{
            this.Connections[fromId].RemoteOffer(offer) 
        }
    }

    receiveCandidate(fromId, candidate) {
        // console.log("ice from ", fromId, candidate)
        this.Connections[fromId].addRemoteICE(candidate) 
    }

    newConnection(fromId) {
        const network = new RTCPeer(this.MyId, fromId, this)
        network.FindIce();
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

}

export { ServerNetwork };