"use strict";

const port = 80
var app = require('express')();
app.listen(port, function () {
    console.log("Listening on " + port);
});
const parse = require('./byteParser.js')
//var db=require('./mysqls.js')
//db.init()
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8050,
    perMessageDeflate: {
        zlibDeflateOptions: {// See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },// Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
    }
});

var scene = null;
var clients = [], clientId = 1;
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
                for (let uu in scene) {
                    if (scene[uu].tipe == "craft") {
                        if (scene[uu].me) {
                            craftuuid = uu
                        }
                    }
                }
            }
            if (data.task == "addcraft") {
                scene[data.data.uuid] = data.data;
                if (scene[data.data.uuid].me) {
                    craftuuid = data.data.uuid
                }
                clients.forEach(other => {
                    if (other.id != self.id) {
                        other.socket.send(JSON.stringify({ "task": "addcraft", "data": data.data }))
                    }
                });
            }
        } catch (err) {
            socket.binaryType = 'arraybuffer';
            sendtoother(self, data)
            if (data.byteLength == 4) {
                var idds = new Uint32Array(data)
                scene[idds[0]] = undefined
            } else if (data.byteLength % 72 == 0) {
                //total=data.byteLength/64
                //var objs=parse.frombytesgroupnode(data)
                //updates.push({ updates: data, sentTo: 1, time: new Date().getTime(), from: self.id, bullett: true })
            } else if (data.byteLength % 56 == 0) {
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
                } else {//*/
                    scene[datas.id].vel = datas.vel;
                    scene[datas.id].pos = datas.pos;
                    scene[datas.id].rotvel = datas.rotvel;
                    scene[datas.id].helt = datas.helt;
                    scene[datas.id].rot._x = datas.rot.x
                    scene[datas.id].rot._y = datas.rot.y
                    scene[datas.id].rot._z = datas.rot.z
                }
            } else { console.log(data,data.byteLength,err) }
        }
    });
    socket.on('close', () => {
        for (let num in clients) {
            if (clients[num].id == self.id) {
                clients.splice(num, 1);
                if (!hasmaster() && clients.length != 0) {
                    console.log("elect master id: " + clientId + " ||craft uuid: " + craftuuid + " ||at " + new Date())
                    clients[0].master = true;
                    clients[0].socket.send(JSON.stringify({ task: "elect", master: true }))
                }
                let buffer = new ArrayBuffer(4);
                let tmp = new Uint32Array(buffer);
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
    for (let oi in clients) {
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
app.get("/", function (req, res) {/* serves main page */
    //console.log('static file request : ' + JSON.stringify(req.params));
    res.sendFile(__dirname + '/index.htm')
});

app.get(/^(.+)$/, function (req, res) {/* serves all the static files */
    //res.json()
    //console.log(req.params[0]);
    if (req.params[0].indexOf("/school") == 0) {
        school.handleGetRequest(req, res)
    } else {
        switch (req.params[0]) {
            case "/index": index(req, res); break;
            case "/mygame": game(req, res); break;
            case "/pong": pong(req, res); break;
            default:
                //console.log('static file request : ' + JSON.stringify(req.params));
                res.sendFile(__dirname + req.params[0]);
                break;
        }
    }
});


function game(req, res) {
    //console.log('static file request : ' + "/mygame/misc_controls_pointerlock.html");
    res.sendFile(__dirname + "/mygame/misc_controls_pointerlock.html");
}
function pong(req, res) {
    //console.log('static file request : ' + "/mygame/pong3.html");
    res.sendFile(__dirname + "/mygame/pong3.html");
}
function index(req, res) {
    //console.log("index");
    res.json([{ name: "dsa" }, { val: "ians" }])
}




app.post("/user/add", function (req, res) {
    console.log("/user/add");
    res.send("OK");
});
app.post("/school" + /^(.+)$/, function (req, res) {
    school.handlepostRequest(req, res)
});
app.post("/school/weatherdata", function (req, res) {
    /* some server side logic */
    //console.log("/user/add");
    res.send("OK");
});
app.post('/userasyinc', (req, res) => {
    res.json([{ name: "dsa" }, { val: "ians" }])
    res.end();
})