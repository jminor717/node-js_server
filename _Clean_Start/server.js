const Koa = require('koa');
const Router = require('@koa/router');
const fs = require('fs');
const { bodyParser } = require("@koa/bodyparser");
const { WebSocket, WebSocketServer } = require("ws");
// import WebSocket, { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });
const app = new Koa();
const router = new Router();
const port = 3000;

function sendFile(ctx, fileName) {
    // ctx.body = index;
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(__dirname + fileName);
}

router.get('/', (ctx, next) => sendFile(ctx, '\\index.html'));
router.get('/game', (ctx, next) => sendFile(ctx, '\\gme\\game.html'));
// router.get('/ActiveServers', (ctx, next) => { ctx.response.type = "application/json"; ctx.response.body = ServerTracker });
// router.post('/JoinServer', (ctx, next) => { JoinServer(ctx) });
// router.post('/LeaveServer', (ctx, next) => { LeaveServer(ctx) });
// router.post('/CreateServer', (ctx, next) => { CreateServer(ctx) })

// static file server
router.get(/\/[^\/]+\.[\w]+/, async (ctx, next) => {
    try {
        index = fs.readFileSync(__dirname + ctx.url); //   +"\\.."+
        if (ctx.url.endsWith(".js")) {
            ctx.response.type = 'text/javascript';
        }
        ctx.response.body = index;
    } catch (error) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
            message: error.message
        };
    }

});

app.listen(port, '0.0.0.0', function () {
    console.log("Listening on " + port);
});

// log all calls to server
app.use(async (ctx, next) => {
    const start = Date.now();
    let one = await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`, one);
});

app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());
app.use(async (ctx, next) => {
    // the parsed body will store in ctx.request.body
    // if nothing was parsed, body will be an empty object {}
    ctx.body = ctx.request.body;
});


let ServerTracker = {
    Servers: {
        ServerName: {
            ServerName: "",
            Host: "",
            Players: [""],
            Sockets: {},
        }
    },
};
ServerTracker.Servers = {};

let PlayerToServerMap = {};

function LeaveServer(id) {
    if (Object.hasOwnProperty.call(PlayerToServerMap, id)) {
        _leaveServer(PlayerToServerMap[id], id);
        PlayerToServerMap[id] = undefined;
        delete PlayerToServerMap[id];
    }

}

function RemoveFromArray(array, item) {
    const index = array.indexOf(item);
    if (index > -1) { // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
    }
}

function _leaveServer(knownServer, Id) {
    if (Object.hasOwnProperty.call(ServerTracker.Servers, knownServer)) {
        let server = ServerTracker.Servers[knownServer];
        if (server.Host === Id) {
            server.Host = ""
        } else {
            RemoveFromArray(server.Players, Id)
        }
        if (server.Host === "" && server.Players.length === 0) {
            delete ServerTracker.Servers[knownServer];
        }
        return true;
    }
    return false;
}

function ValidateServer(serverName) {
    return serverName && serverName.length > 2
}

function CreateServer(request, ws) {
    if (!ValidateServer(request.ServerName)) {
        ws.send(JSON.stringify({ TYPE: ReceiveMessages.ERROR, message: "Server name invalid" }));
        console.log("server NOt Found")
    } else if (!Object.hasOwnProperty.call(ServerTracker.Servers, request.ServerName)) {
        ServerTracker.Servers[request.ServerName] = {
            ServerName: request.ServerName,
            Host: request.MyId,
            Players: [],
            Sockets: {}
        }
        ServerTracker.Servers[request.ServerName].Sockets[request.MyId] = ws
        PlayerToServerMap[request.MyId] = request.ServerName;

        ws.send(JSON.stringify({ TYPE: ReceiveMessages.ACTIVE, data: ServerTracker }, replacer));
        console.log("create server " + request.ServerName)
    } else {
        ws.send(JSON.stringify({ TYPE: ReceiveMessages.ACTIVE, data: ServerTracker }, replacer));
        console.log("server exists " + request.ServerName)
    }
}

function JoinServer(request, ws) {
    if (Object.hasOwnProperty.call(ServerTracker.Servers, request.ServerName)) {
        if (PlayerToServerMap[request.MyId] === request.ServerName) {
            ws.send(JSON.stringify({ TYPE: ReceiveMessages.ACTIVE, data: ServerTracker.Servers[request.ServerName] }, replacer));
        } else {

            let host = ServerTracker.Servers[request.ServerName].Host
            if (host) {
                let s1 = ServerTracker.Servers[request.ServerName].Sockets[host]
                s1.send(JSON.stringify({ TYPE: ReceiveMessages.NEW_CONNECTION, FROM: request.MyId }, replacer));
            }

            for (const playerId of ServerTracker.Servers[request.ServerName].Players) {
                let socket = ServerTracker.Servers[request.ServerName].Sockets[playerId]
                socket.send(JSON.stringify({ TYPE: ReceiveMessages.NEW_CONNECTION, FROM: request.MyId }, replacer));
            }
            PlayerToServerMap[request.MyId] = request.ServerName;
            ServerTracker.Servers[request.ServerName].Players.push(request.MyId);
            ServerTracker.Servers[request.ServerName].Sockets[request.MyId] = ws;
            ws.send(JSON.stringify({ TYPE: ReceiveMessages.ACTIVE, data: ServerTracker.Servers[request.ServerName] }, replacer));

        }
    }
}

function replacer(key, value) {
    if (key == "Sockets") return undefined;
    else return value;
}

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

wss.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('error', console.error);
    ws.on('pong', heartbeat);

    ws.on('close', function close() {
        LeaveServer(ws.ID)
        console.log('disconnected', ws.ID);
    });
    ws.on('message', function message(da, isBinary) {
        let data = JSON.parse(da)
        // console.log(data)
        switch (data.TYPE) {
            case SendMessages.INIT: ws.ID = data.MyId; break;
            case "ActiveServers": ws.ID = data.MyId; break;
            case SendMessages.JOIN_SERVER: JoinServer(data, ws); break;
            case "LeaveServer": LeaveServer(ws.ID); break;
            case SendMessages.CREATE_SERVER: CreateServer(data, ws); break;
            case SendMessages.ICE_CANDIDATE: relay(data.data, ReceiveMessages.ICE_CANDIDATE, data.TO, ws.ID); break;
            case SendMessages.ICE_OFFER: relay(data.data, ReceiveMessages.ICE_OFFER, data.TO, ws.ID); break;
            default:
                console.log(data)
                break;
        }
        // wss.clients.forEach(function each(client) {
        //     if (client.readyState === WebSocket.OPEN) {
        //         client.send(JSON.stringify(data), { binary: isBinary });
        //     }
        // });
    });
});

function relay(data, type, toId, fromId) {
    if (Object.hasOwnProperty.call(PlayerToServerMap, toId)) {
        let _server = PlayerToServerMap[toId];
        if (ServerTracker.Servers[_server].Sockets[toId]) {
            console.log("relay TO", toId, type)
            ServerTracker.Servers[_server].Sockets[toId]
                .send(JSON.stringify({ TYPE: type, FROM: fromId, data: data }, replacer));
        } else {
            console.log("socket Not Found", toId, ServerTracker.Servers[_server])
        }
    }
    // console.log(data, type, toId)
}

function heartbeat() {
    this.isAlive = true;// console.log("pong " + this.ID);
}

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            console.log("dead", ws.ID);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(); // console.log("ping", ws.ID);
    });
}, 5000);

wss.on('close', function close() { console.log("close"); clearInterval(interval); });