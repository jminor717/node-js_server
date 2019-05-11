
class object {

}
var schema = { "task": "getobjects" }


connection = new WebSocket('ws://192.168.1.39:8080');
connection.onopen = function () {
    connection.send(JSON.stringify({ "task": "getobjects" }))
};



function start() {
    console.log(scene.children)
    connection.send(JSON.stringify({ "task": "setscene", "data": trackedObjects }))
}

connection.onmessage = function (data) {
    //console.log(data.data)
    try {
        // console.log(data.data)
        let obj = JSON.parse(data.data)
        if (obj.task == "create") {
            createscene(obj.data)
        }
        if (obj.task == "addcraft") {
            //console.log("new crfffft")
            //console.log(obj.data)
            //trackedObjects[obj.data.uuid] = obj.data;
            //trackedObjects[obj.data.uuid].me = false;

            addcraft(obj.data)
        }
        if (obj.task == "elect") {
            console.log("will become master " + obj.master)
            master = obj.master
            //console.log("is master "+master)
        }
    } catch (err) {
        connection.binaryType = 'arraybuffer';
        //console.log(data.data)
        if (data.data.byteLength == 4) {
            var idds = new Uint32Array(data.data)
            removeFromSceneById(idds[0])
        } else if (data.data.byteLength % 72 == 0) {
            makebullete(frombytesgroup(data.data))
        } else {
            //console.log(data.data)
            updateobj(frombytes(data.data))
        }
    }

}

function sent() {
    connection.send(2626)
}
function updatebyUUid(obj, tipe) {
    dat = tobytes(obj.position, obj._physijs.linearVelocity, obj.rotation, obj._physijs.angularVelocity, obj.health, obj.uuid, 4)
    connection.send(dat)
}
function removefromscene(obj) {
    var buf = new ArrayBuffer(4)
    var arr = new Uint32Array(buf)
    arr[0] = obj.uuid;
    //console.log(arr[0],obj.uuid)
    connection.send(buf)
}

function sendbytts(arraybuffer) {
    connection.send(arraybuffer)
}
