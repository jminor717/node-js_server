//const express = require('express')
const port = 80
//express.Router.call()
//const app = express()
var app = require('express')();
app.listen(port, function () {
    console.log("Listening on " + port);
});
var scene = null;
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

wss.on("connection", function (socket) {
    var count = 0;
    //console.log(socket)
    socket.on('event', data => { console.log(data) });
    socket.on("message", data => {
        //console.log(socket)
        if (scene == null) {
            scene ={"type":"scene", "objects":JSON.parse(data)}
            console.log(scene)
        }else{
            socket.send(JSON.stringify(scene))
        }
    });
    socket.emit("ih")
    socket.ping("cefuybgihn")
    wss.emit("gybibhn")
})

//socket.send(JSON.stringify({cmd:count}))
//wss.on("headers", data => { console.log(data) });

/*
var io1 = require('socket.io').listen(8123);

io1.on('connection', function(socket1) {
  socket1.on('bar', function(msg1) {
    console.log(msg1);
  });
});



var http = require('http').createServer(app);
var io = require('socket.io')(http);
io.on('connection', client => {
    client.on('event', data => { console.log(data) });
    client.on('disconnect', () => { console.log("event") });
    console.log(client)
});

io.on('connection', function (socket) {
    console.log('an user connected');
});

const server = require('http').createServer();
const io = require('socket.io')(server);
io.on('connection', client => {
  client.on('event', data => { console.log(data) });
  client.on('disconnect', () => { console.log("event") });
  console.log(client)
});
server.listen(3000);

const server = require('http').createServer(app);
const io = require('socket.io')(server);

//*///var os = require("os");
//var hostname = os.hostname();

//const app = require('express')();


//server.listen(3000);
//*/
/*
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', () => { console.log("event") });
server.listen(3000);
//*/

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
    res.sendfile(__dirname + "/mygame/misc_controls_pointerlock.html");
}
function pong(req, res) {
    //console.log('static file request : ' + "/mygame/pong3.html");
    res.sendfile(__dirname + "/mygame/pong3.html");
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