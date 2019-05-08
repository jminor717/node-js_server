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
    let self = { socket: socket, id: clientId, lastUpdate: new Date().getTime() };
    clientId++;
    socket.on('event', data => { console.log(data) });
    socket.on("message", data => {
        try {
            data = JSON.parse(data)
            //console.log(data)
            if (data.task == "getobjects") {
                socket.send(JSON.stringify({ task: "create", data: scene }))
                self.lastUpdate = new Date().getTime()
            }
            if (data.task == "setscene") {
                scene = data.data;
            }
            if (data.task == "uda") {
                //scene[data.data.uuid]=data.data;
                //updates.push({updates:data.data,sentTo:1,time:new Date().getTime(),from:self.id})
            }
        } catch (err) {
            socket.binaryType = 'arraybuffer';
            //console.log( data)
            //console.log( parse.frombytesnode(data,4).id)
            var datas=parse.frombytesnode(data, 4)
            updates.push({ updates:datas , sentTo: 1, time: new Date().getTime(), from: self.id })
            if(scene[datas.id]==null){return}
            scene[datas.id].vel=datas.vel;
            scene[datas.id].pos=datas.pos;
            scene[datas.id].rotvel=datas.rotvel;
            scene[datas.id].helt=datas.helt;
            scene[datas.id].rot._x=datas.rot.x
            scene[datas.id].rot._y=datas.rot.y
            scene[datas.id].rot._z=datas.rot.z
            
        }

        //console.log(data)

    });
    setInterval(() => {
        
        let requiredupdates = getupdates(self)
        if (requiredupdates.length == 0) { return; }
        //console.log(requiredupdates,self.id)
        requiredupdates.forEach(uda => {
            socket.binaryType = 'arraybuffer';
            socket.send(parse.tobytesnode(uda, 4))
        })
        //socket.send(JSON.stringify({ task: "uda", data: requiredupdates }))
    }, 100);
    socket.emit("ih")
    socket.ping("cefuybgihn")
    wss.emit("gybibhn")
})


function getupdates(to) {
    let from = to.lastUpdate;
    let required = [];
    for (var i = 0; i < updates.length; i++) {
        if (from < updates[i].time && to.id != updates[i].from) {
            required.push(updates[i].updates); updates[i].sentTo++;
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