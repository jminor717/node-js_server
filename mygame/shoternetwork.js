
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
    try{
        let obj = JSON.parse(data.data)
        if(obj.task=="create"){
            createscene(obj.data)
        }
        if(obj.task=="uda"){
            updatescene(obj.data)
        }
    }catch(err){
        connection.binaryType = 'arraybuffer';
        //console.log(data)
        updateobj(frombytes(data.data,4))
    }

}

function sent() {
    connection.send(2626)
}
function updatebyUUid(obj,tipe){
    dat= tobytes(obj.position,obj._physijs.linearVelocity,obj.rotation,obj._physijs.angularVelocity,obj.health,obj.uuid,4)
    connection.send(dat)
}