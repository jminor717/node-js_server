//const express = require('express')
const port = 80
//express.Router.call()
//const app = express()
var app = require('express')();
app.listen(port, function () {
    console.log("Listening on " + port);
});
const parse = require('./byteParser.js')
const WebSocket = require('ws');

const wss = new WebSocket.Server({
    port: 8080,
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

var scene = null;
var clients = [], updates = [], clientId = 1;
wss.on("connection", function (socket) {

    clients.push({ socket: socket, id: clientId, lastUpdate: new Date().getTime() })
    var self = { socket: socket, id: clientId, lastUpdate: new Date().getTime() };
    clientId++;
    socket.on('event', data => { console.log(data) });
    socket.on("message", data => {
        try {
            data = JSON.parse(data)
            if (data.task == "getobjects") {
                socket.send(JSON.stringify({ task: "create", data: scene }))
                self.lastUpdate = new Date().getTime()
            }
            if (data.task == "setscene") {
                scene = data.data;
                //for (id in scene){
                    //console.log(id)
                //}
            }
            if (data.task == "uda") {
                //scene[data.data.uuid]=data.data;
                //updates.push({updates:data.data,sentTo:1,time:new Date().getTime(),from:self.id})
            }
        } catch (err) {
            socket.binaryType = 'arraybuffer';
            if (data.byteLength == 4) {
                var idds = new Uint32Array(data)
                //console.log(idds[0])
                scene[idds[0]] = null
                updates.push({ remove: data ,sentTo: 1, time: new Date().getTime(), from: self.id})
            } else if (data.byteLength % 64 == 0) {
                //total=data.byteLength/64
                //var objs=parse.frombytesgroupnode(data)
                updates.push({ updates: data, sentTo: 1, time: new Date().getTime(), from: self.id, bullett: true })
            } else {
                //console.log( data)
                var datas = parse.frombytesnode(data)
                updates.push({ updates: data, sentTo: 1, time: new Date().getTime(), from: self.id })
                if (scene[datas.id] == null) {
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
    setInterval(() => {

        let requiredupdates = getupdates(self)
        if (requiredupdates.length == 0) { return; }
        //console.log(requiredupdates,self.id)
        requiredupdates.forEach(uda => {
            socket.binaryType = 'arraybuffer';
            if ("bullett" in uda) {
                socket.send(uda.updates)
            } else if ("remove" in uda) {
                socket.send(uda.remove)
            } else { 
                socket.send(uda.updates)
            }

        })
        //socket.send(JSON.stringify({ task: "uda", data: requiredupdates }))
    }, 50);
    socket.emit("ih")
    socket.ping("cefuybgihn")
    wss.emit("gybibhn")
})


function getupdates(to) {
    let from = to.lastUpdate;
    let required = [];
    for (var i = 0; i < updates.length; i++) {
        if (from < updates[i].time && to.id != updates[i].from) {
            //console.log(to.id , updates[i].from)
            required.push(updates[i]); updates[i].sentTo++;
            if (updates[i].sentTo >= clients.length) { updates.splice(i, 1); i-- }
        }
    }
    return required
}



const school = require('./school/school.js')



/* serves main page */
app.get("/", function (req, res) {
    //console.log('static file request : ' + JSON.stringify(req.params));
    res.sendfile('index.htm')
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