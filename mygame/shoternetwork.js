
class object {

}


var isopen = false, init = false;
var start;
connection = new WebSocket('ws://192.168.1.39:8080');
connection.onopen = function () {
    isopen = true;
    if (init) {
        start()
    }

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
    connection.send(JSON.stringify(scene.children))
}

connection.onmessage = function (data) {
    console.log(data.data)
    let obj = JSON.parse(data.data)
    //createscene(obj.objects)
}

function sent() {
    connection.send(2626)
}