//const express = require('express')
const port = 8082
//express.Router.call()
//const app = express()
var app = require('express')()
const bodyParser = require('body-parser');
app.listen(port, '0.0.0.0', function () {
    console.log("Listening on " + port);
});
app.use(bodyParser.json({ limit: "25000kb" }));

const parse = require('./byteParser.js')
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8050,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed.
    }
});


const { PeerServer } = require("peer");

const peerServer = PeerServer({ port: 9000, path: "/" });

peerServer.on('connection', (stream) => {
    console.log('Ah, we have  user!', stream.id, stream.token);
});

peerServer.on('error', (err) => {
    console.log('ERR!\n', err);
});

// var privateKey = fs.readFileSync('sslcert/server.key', 'utf8');
// var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');

// const { PeerServer } = require('peer');
// const peerServer = PeerServer({
//     port: 443,
//     path: '/',
//     ssl: {
//         key: privateKey,
//         cert: certificate
//     }

// });

var scene = null;
var clients = [], updates = [], clientId = 1;
wss.on("connection", function (socket) {
    var ismaster = false;
    var craftuuid = 0;
    if (clients.length == 0) {
        ismaster = true
    }
    if (!hasmaster()) {
        console.log("creat master id: " + clientId + " ||craft uuid: " + craftuuid + " ||at " + new Date())
        //console.log('creat master id:   ${clientId}   ||craft uuid:   ${craftuuid}  ||at  ${new Date()}')
        ismaster = true
        socket.send(JSON.stringify({ task: "elect", master: ismaster }))
    }
    clients.push({ socket: socket, id: clientId, lastUpdate: new Date().getTime(), master: ismaster });
    var self = { socket: socket, id: clientId, lastUpdate: new Date().getTime(), master: ismaster };
    clientId++;

    cont = 0
    clients.forEach(client => {
        if (client.master) { cont++ }
    })
    //console.log("game has "+cont+" masters")
    socket.on('event', data => { console.log(data) });
    socket.on("message", data => {
        try {
            data = JSON.parse(data)
            if (data.task == "getobjects") {
                socket.send(JSON.stringify({ "task": "create", "data": scene }))
                self.lastUpdate = new Date().getTime()
            }
            if (data.task == "setscene") {
                scene = data.data;
                for (uu in scene) {
                    if (scene[uu].tipe == "craft") {
                        //console.log(uu,scene[uu])
                        if (scene[uu].me) {
                            craftuuid = uu
                        }
                    }
                }
                //for (id in scene){
                //console.log(id)
                //}
            }
            if (data.task == "addcraft") {
                //console.log(" new player #################3");
                scene[data.data.uuid] = data.data;
                if (scene[data.data.uuid].me) {
                    craftuuid = data.data.uuid
                }
                //console.log(scene[data.data.uuid]);
                clients.forEach(other => {
                    if (other.id != self.id) {
                        other.socket.send(JSON.stringify({ "task": "addcraft", "data": data.data }))
                        //console.log("new player to "+other.id);
                    }
                });
                //console.log("#################3 new player");
                //sendtoother(self,JSON.stringify({ "task": "addcraft", "data": data.data }))
                //scene[data.data.uuid]=data.data;
                //updates.push({updates:data.data,sentTo:1,time:new Date().getTime(),from:self.id})
            }
        } catch (err) {
            socket.binaryType = 'arraybuffer';
            sendtoother(self, data)
            if (data.byteLength == 4) {
                var idds = new Uint32Array(data)
                //console.log(idds[0])
                scene[idds[0]] = undefined
                // updates.push({ remove: data ,sentTo: 1, time: new Date().getTime(), from: self.id})
            } else if (data.byteLength % 64 == 0) {
                //total=data.byteLength/64
                //var objs=parse.frombytesgroupnode(data)
                //updates.push({ updates: data, sentTo: 1, time: new Date().getTime(), from: self.id, bullett: true })
            } else {
                //console.log( data)
                var datas = parse.frombytesnode(data)
                // updates.push({ updates: data, sentTo: 1, time: new Date().getTime(), from: self.id })
                if (scene == null) { return }
                if (scene[datas.id] == null && datas.helt != null) {
                    scene[datas.id] = {
                        vel: datas.vel,
                        pos: datas.pos,
                        rotvel: datas.rotvel,
                        helt: datas.helt,
                        rot: {
                            _x: datas.rot.x,
                            _y: datas.rot.y,
                            _z: datas.rot.z
                        }
                    }
                } else {
                    scene[datas.id].vel = datas.vel;
                    scene[datas.id].pos = datas.pos;
                    scene[datas.id].rotvel = datas.rotvel;
                    scene[datas.id].helt = datas.helt;
                    scene[datas.id].rot._x = datas.rot.x
                    scene[datas.id].rot._y = datas.rot.y
                    scene[datas.id].rot._z = datas.rot.z
                }
            }
        }
    });
    socket.on('close', () => {
        for (num in clients) {
            if (clients[num].id == self.id) {
                clients.splice(num, 1);
                //console.log('websocket closed '+self.id+" avalable "+clients)
                if (!hasmaster() && clients.length != 0) {
                    console.log("elect master id: " + clientId + " ||craft uuid: " + craftuuid + " ||at " + new Date())
                    clients[0].master = true;
                    clients[0].socket.send(JSON.stringify({ task: "elect", master: true }))
                }
                buffer = new ArrayBuffer(4);
                var tmp = new Uint32Array(buffer);
                tmp[0] = craftuuid;
                console.log("close conect id: " + self.id + " ||craft uuid: " + tmp + " ||at " + new Date())
                clients.forEach(client => {
                    client.socket.send(buffer)
                })

            }

        }
        scene[craftuuid] = undefined
    });

})

function hasmaster() {
    var isi = false;
    for (oi in clients) {
        if (clients[oi].master) {
            isi = true;
        }
    }
    return isi;
}


function sendtoother(from, data) {
    clients.forEach(other => {
        if (other.id != from.id) {
            other.socket.send(data)
        }
    })
}

const school = require('./school/school.js')



/* serves main page */
app.get("/", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));
    res.sendFile(__dirname + '/MainForm.html')
});

app.get("/index", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));
    res.sendFile(__dirname + '/index.htm')
});

app.get("/cat", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));C:\repos\node-js_server\catBox.html
    res.sendFile(__dirname + '/catBox1.html')
});

app.get("/catData", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));C:\repos\node-js_server\catBox.html
    res.send({
        FW1: Math.random(), FW2: Math.random(), FW3: Math.random(),
        RW1: Math.random(), RW2: Math.random(), RW3: Math.random(),
        FT: Math.random(), RT: Math.random(), RD: Math.random() * 8000, FD: Math.random() * 8000
    })
});

app.get("/overrideON", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));C:\repos\node-js_server\catBox.html 3600000
    res.send("{\"time\":10000}")
});
app.get("/overrideOFF", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));C:\repos\node-js_server\catBox.html
    res.send("{\"time\":0}")
});

app.post("/user/add", function (req, res) {
    /* some server side logic */
    console.log("/user/add");
    res.send("OK");
});

app.post("/school" + /^(.+)$/, function (req, res) {
    /* some server side logic */
    console.log(req.params[0]);
    school.handlepostRequest(req, res)
});

let ServerTracker = {
    Servers: {
        "ServerName": {
            ServerName: "",
            Host: "",
            Players: [""]
        }
    },
    PlayersNotInServer: [""],
};
ServerTracker.PlayersNotInServer = [];
ServerTracker.Servers = {};

let PlayerToServerMap = {};

let IDs = [];


/**
JoinNetwork
LeaveNetwork
JoinServer
LeaveServer
CreateServer

 */
function RemoveFromArray(array, item) {
    const index = array.indexOf(item);
    if (index > -1) { // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
    }
}

function LeaveServer(knownServer, Id) {
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

function ValidPlayer(playerId) {
    return playerId && playerId.length > 8
}

function ValidateServer(serverName) {
    return serverName && serverName.length > 2
}

app.post("/PeerIdUpdate", function (req, res) {
    /* some server side logic */
    let request = req.body;
    let response = {};

    if (ValidPlayer(request.MyId ?? request.RemoveId)) {
        console.log(request);
        switch (request.Action) {
            case "JoinNetwork":
                if (request.MyId && !PlayerToServerMap[request.MyId]) {
                    //ServerTracker.PlayersNotInServer.push(request.MyId);
                    //PlayerToServerMap[request.MyId] = "";
                }
                break;
            case "LeaveNetwork":
                if (request.RemoveId && Object.hasOwnProperty.call(PlayerToServerMap, request.RemoveId)) {
                    let knownServer = PlayerToServerMap[request.RemoveId];
                    if (knownServer === "") {
                        RemoveFromArray(ServerTracker.PlayersNotInServer, request.RemoveId)
                    } else if (LeaveServer(knownServer, request.RemoveId)) {
                        // server was found and left
                    } else {
                        console.log("No Do Goo", request, ServerTracker); // server not found
                    }
                    delete PlayerToServerMap[request.RemoveId];
                }
                break;
            case "JoinServer":
                if (Object.hasOwnProperty.call(ServerTracker.Servers, request.ServerName)) {
                    if (PlayerToServerMap[request.MyId] === request.ServerName) {
                        response.error = "Already in server";
                    } else {
                        PlayerToServerMap[request.MyId] = request.ServerName;
                        ServerTracker.Servers[request.ServerName].Players.push(request.MyId);
                    }
                }
                // else server does not exist
                break;
            case "LeaveServer":
                if (Object.hasOwnProperty.call(PlayerToServerMap, request.MyId)) {
                    LeaveServer(PlayerToServerMap[request.MyId], request.MyId);
                    PlayerToServerMap[request.MyId] = undefined;
                    delete PlayerToServerMap[request.MyId];
                }
                break;
            case "CreateServer":
                if (!ValidateServer(request.ServerName)) {
                    response.error = "Server name invalid"
                }else if (!Object.hasOwnProperty.call(ServerTracker.Servers, request.ServerName)) {
                    ServerTracker.Servers[request.ServerName] = {
                        ServerName: request.ServerName,
                        Host: request.MyId,
                        Players: [],
                    }
                    PlayerToServerMap[request.MyId] = request.ServerName;
                }
                break;
            default:
                console.log("unknown Action")
                break;
        }
        console.log(PlayerToServerMap);//, ServerTracker
    } else {
        console.error("Bad Player", request);
        response.error = "Player Id Not Created"
    }

    console.log({ Servers: ServerTracker.Servers, Response: response })
    res.send({ Servers: ServerTracker.Servers, Response: response });
});

app.get("/PeerIds", function (req, res) {
    /* some server side logic */
    res.send(ServerTracker);
});

/* serves all the static files */
app.get(/^(.+)$/, function (req, res) {
    //res.json()
    //console.log(req.params[0]);
    if (req.params[0].indexOf("/school") == 0) {

        school.handleGetRequest(req, res)

    } else {
        switch (req.params[0]) {
            case "/index": index(req, res); break;
            case "/mygame": game(req, res); break;
            case "/NewGameNewLife": newGame(req, res); break;
            case "/NewGameNewLifeS2": newGame2(req, res); break;
            case "/bab": babylon(req, res); break;
            case "/TestNetwork": TestNetwork(req, res); break;
            case "/pong": pong(req, res); break;
            default:
                //console.log('static file request : ' + JSON.stringify(req.params));
                res.sendFile(__dirname + req.params[0]);
                break;
            // code block
        }
    }
});


app.post("/school/weatherdata", function (req, res) {
    /* some server side logic */
    //console.log("/user/add");
    res.send("OK");
});


function game(req, res) {
    //console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
    res.sendFile(__dirname + "/mygame/misc_controls_pointerlock.html");
}
function newGame(req, res) {
    //console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
    res.sendFile(__dirname + "/NewGameNewLife/NGNL.html");
}

function babylon(req, res){
    res.sendFile(__dirname + "/babalon1/index.html");
}

function newGame2(req, res) {
    //console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
    res.sendFile(__dirname + "/NGNL_S2/NGNL2.html");
}

function TestNetwork(req, res) {
    //console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
    res.sendFile(__dirname + "/NewGameNewLife/networkTester.html");
}
function pong(req, res) {
    //console.log('static file request : ' + "/mygame/pong3.html");
    res.sendFile(__dirname + "/mygame/pong3.html");
}
function index(req, res) {
    //console.log("index");
    res.json([{ name: "dsa" }, { val: "ians" }])
}

app.post('/userasyinc', (req, res) => {
    res.json([{ name: "dsa" }, { val: "ians" }])
    res.end();
})
//(JSON.stringify