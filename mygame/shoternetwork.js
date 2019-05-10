
class object {

}
var schema= {"task":"getobjects"}

var isopen = false, init = false;
var start;
connection = new WebSocket('ws://192.168.1.39:8080');
connection.onopen = function () {
    isopen = true;
    connection.send(JSON.stringify({"task":"getobjects"}))
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
        //console.log(data.data)
        if(data.data.byteLength==4){
            var idds= new Uint32Array(data.data)
            console.log(idds[0])
            removeFromSceneById(idds[0])
        }else if(data.data.byteLength % 72 == 0){
            makebullete(frombytesgroup(data.data))
        }else{
            //console.log(data.data)
            updateobj(frombytes(data.data))}
    }

}

function sent() {
    connection.send(2626)
}
function updatebyUUid(obj,tipe){
    dat= tobytes(obj.position,obj._physijs.linearVelocity,obj.rotation,obj._physijs.angularVelocity,obj.health,obj.uuid,4)
    connection.send(dat)
}
function removefromscene(obj){
    var buf=new ArrayBuffer(4)
    var arr= new Uint32Array(buf)
    arr[0]=obj.uuid;
    console.log(arr[0],obj.uuid)
    connection.send(buf)
}

function sendbytts(arraybuffer){
    connection.send(arraybuffer)
}