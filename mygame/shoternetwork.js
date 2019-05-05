
class object {

}
var schema= {"task":"getobjects"}

var isopen = false, init = false;
var start;
connection = new WebSocket('ws://192.168.1.39:8080');
connection.onopen = function () {
    isopen = true;
    connection.send(JSON.stringify({"task":"getobjects"}))
    //init(objs)
};

function doneinit() {
    init = true;
    if (isopen) {
        start()
    }
}

function start() {
    objects = []
    console.log(scene.children)
    
    connection.send(JSON.stringify({"task":"setscene", "data":trackedObjects }))
}

connection.onmessage = function (data) {
    //console.log(data.data)
    let obj = JSON.parse(data.data)
    if(obj.task=="create"){
        createscene(obj.data)
    }
    if(obj.task=="update"){
        updatescene(obj.data)
    }
}

function sent() {
    connection.send(2626)
}
function updatebyUUid(obj,tipe){
    trackedObjects[obj.uuid]={
        type: tipe,
        vel: obj._physijs.linearVelocity,
        pos: obj.position,
        rot: obj.rotation,
        rotvel: obj._physijs.angularVelocity,
        uuid: obj.uuid,
        helt: obj.health
    }
    //console.log(obj)
    connection.send(JSON.stringify({"task":"setscene", "data":trackedObjects }))
}