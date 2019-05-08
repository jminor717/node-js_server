module.exports = {
    tobytesnode: function (obj, precesion = 4) {
        return tobytes(obj.pos, obj.vel, obj.rot, obj.rotvel,obj.helt, obj.id, precesion);
    },
    frombytesnode: function (buffer, precesion = 4) {
        return frombytes(buffer, precesion);
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

function frombytes(buffer, precesion = 4) {
    var tmp = (12 * precesion)+precesion
    //console.log(buffer)
    var Float32View = new Float32Array(buffer.slice(0, tmp));
    var uint32view = new Uint32Array(buffer.slice(tmp, tmp + precesion))
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
        id: uint32view[0]
    }
}