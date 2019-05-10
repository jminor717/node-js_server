module.exports = {
    tobytesnode: function (obj, precesion = 4) {
        return tobytes(obj.pos, obj.vel, obj.rot, obj.rotvel, obj.helt, obj.id, precesion);
    },
    frombytesnode: function (buffer) {
        return frombytes(buffer);
    },
    frombytesgroupnode: function (buffer) {
        return frombytesgroup(buffer);
    }
}
//toArrayBuffer(buffer)
function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

function tobytes(pos, vel, rot, rotvel, health, id, precesion = 4) {
    var bufferf = new ArrayBuffer((12 * precesion) + precesion + precesion);
    var Float32View = new Float32Array(bufferf);
    //console.log(health)
    Float32View[0] = pos.x
    Float32View[1] = pos.y
    Float32View[2] = pos.z

    Float32View[3] = vel.x
    Float32View[4] = vel.y
    Float32View[5] = vel.z

    Float32View[6] = rot.x
    Float32View[7] = rot.y
    Float32View[8] = rot.z

    Float32View[9] = rotvel.x
    Float32View[10] = rotvel.y
    Float32View[11] = rotvel.z
    Float32View[12] = health
    //console.log(Float32View[12])
    var uint32view = new Uint32Array(bufferf)
    uint32view[13] = id;
    return bufferf
}

function frombytes(buffer) {
    //var tmp = (12 * precesion)+precesion
    //console.log(buffer)
    var Float32View = new Float32Array(buffer);
    var uint32view = new Uint32Array(buffer)
    //console.log(uint32view)
    return {
        pos: {
            x: Float32View[0],
            y: Float32View[1],
            z: Float32View[2]
        },
        vel: {
            x: Float32View[3],
            y: Float32View[4],
            z: Float32View[5]
        },
        rot: {
            x: Float32View[6],
            y: Float32View[7],
            z: Float32View[8]
        },
        rotvel: {
            x: Float32View[9],
            y: Float32View[10],
            z: Float32View[11]
        },
        helt: Float32View[12],
        id: uint32view[13]
    }
}


function objtipebyte(code = new ArrayBuffer()) {
    var tmp = new Uint32Array(code)
    var tmp2 = new Float32Array(code);
    switch (tmp[0]) {
        case 1://box
            x = tmp2[1]
            y = tmp2[2]
            z = tmp2[3]
            console.log(x, y, z)
            break;
        case 2://ball
            r = tmp2[1]
            console.log(r)
            break;
        default:
            break;
    }
}

function objtipetoByte(tipe = "", dim = {}, time,mass) {
    var buffer = new ArrayBuffer(16);
    switch (tipe) {
        case "box"://box
            buffer = new ArrayBuffer(16)
            var tmp = new Uint32Array(buffer)
            tmp[0] = 1;
            tmp = new Float32Array(buffer);
            tmp[1] = dim.x;
            tmp[2] = dim.y;
            tmp[3] = dim.z;
            break;
        case "sphere"://ball
            buffer = new ArrayBuffer(16)
            var tmp = new Uint32Array(buffer)
            tmp[0] = 2;
            tmp[2] = time;
            tmp[3] = mass;
            tmp = new Float32Array(buffer);
            tmp[1] = dim.r;
            break;
        default:
            break;
    }
    return buffer
}


function frombytesgroup(buffer) {
    total = buffer.byteLength / 72
    //console.log(buffer)
    var objss = {};
    for (var i = 0; i < total; i++) {
        var Float32View = new Float32Array(buffer, (i * 72), 18);
        var uint32view = new Uint32Array(buffer, (i * 72), 18);
        //console.log(uint32view,Float32View)
        objss[uint32view[13]] = {
            pos: {
                x: Float32View[0],
                y: Float32View[1],
                z: Float32View[2]
            },
            vel: {
                x: Float32View[3],
                y: Float32View[4],
                z: Float32View[5]
            },
            rot: {
                x: Float32View[6],
                y: Float32View[7],
                z: Float32View[8]
            },
            rotvel: {
                x: Float32View[9],
                y: Float32View[10],
                z: Float32View[11]
            },
            helt: Float32View[12],
            id: uint32view[13],
            r: Float32View[15],
            tim: uint32view[16],
            mas: uint32view[17]
        }

    }
    //console.log(objss)
    return objss;
}
