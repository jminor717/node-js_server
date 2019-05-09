test()



function test() {
    /*
    var buffer = new ArrayBuffer((12 * 4)+4);
    console.log(buffer.byteLength)
    console.log(buffer)
    var Float32View = new Float32Array(buffer.slice(0,(12*4)));
    for (var i = 0; i < Float32View.length; i++) {
        Float32View[i] = i * 2.3;
    }
    var intaa=new Int32Array(buffer.slice((12*4),(12*4)+4))
    for (var i = 0; i < intaa.length; i++) {
        intaa[i] = i+1 * 3.9;
    }
    */
    //console.log(intaa)
    //console.log(Float32View)
    var first = tobytes({ x: 232.2415, y: 70258.4, z: -2347.444 }, { x: 232.2415, y: 70258.4, z: -2347.444 }, { x: 232.2415, y: 70258.4, z: -2347.444 }, { x: 232.2415, y: 70258.4443252345543, z: -234347.444 }, 23444324,"", 4)
    var obj=frombytes(first, 4)

    //var start=new Date().getTime()

    for(var k=0;k<1;k++){
        var start=new Date().getTime()
        var buf=null;
        for(var j=0;j<1000000;j++){
            buf=tobytes(obj.pos,obj.vel,obj.rot,obj.rotvel,obj.id,4)
            obj=frombytes(buf,4)
        }
        var end=new Date().getTime()
        //console.log(obj)
        console.log(end-start +" runtime")
    }
    buffer1 =objtipetoByte("box",{x:3,y:4.3,z:33})
    buffer2 =objtipetoByte("sphere",{r:.5})
    objtipebyte(buffer2)
    objtipebyte(buffer1)
    console.log(buffer1, buffer2)
    buffer3= appendBuffer(buffer1, buffer2)
    console.log(new Float32Array(buffer3),new Uint32Array(buffer3))
   // var end=new Date().getTime()
    //console.log(end-start)
}

function objtipebyte(code=new ArrayBuffer()){
    var tmp= new Uint32Array(code)
    var tmp2 = new Float32Array(code);
    switch (tmp[0]) {
        case 1://box
            x=tmp2[1]
            y=tmp2[2]
            z=tmp2[3]
            console.log(x,y,z)
            break;
        case 2://ball
            r=tmp2[1]
            console.log(r)
            break;
        default:
            break;
      }
}

function objtipetoByte(tipe="",dim={}){
    var buffer =new ArrayBuffer(16);
    switch (tipe) {
        case "box"://box
            buffer = new ArrayBuffer(16)
            var tmp= new Uint32Array(buffer)
            tmp[0]=1;
            tmp = new Float32Array(buffer);
            tmp[1]=dim.x;
            tmp[2]=dim.y;
            tmp[3]=dim.z;
            break;
        case "sphere"://ball
            buffer = new ArrayBuffer(8)
            var tmp= new Uint32Array(buffer)
            tmp[0]=2;
            tmp = new Float32Array(buffer);
            tmp[1]=dim.r;
            break;
        default:
            break;
      }
      return buffer
}

function appendBuffer(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};




function tobytes(pos, vel, rot, rotvel, id, precesion = 4) {
    var bufferf = new ArrayBuffer((12 * precesion)+precesion);
    var Float32View = new Float32Array(bufferf);
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
    var uint32view = new Uint32Array(bufferf)
    uint32view[12] = id;
    return bufferf
}

function frombytes(/*Float32View,uint32view,*/buffer, precesion = 4) {
    let tmp=12 * precesion
    var Float32View = new Float32Array(buffer);
    var uint32view = new Uint32Array(buffer)
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
        id: uint32view[12]
    }
}