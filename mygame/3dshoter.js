//import { strict } from "assert";



Physijs.scripts.worker = 'Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'Physijs/examples/js/ammo.js';
var camera = {}, scene = {}, renderer = {}, controls = {};
//Physijs/Physijs/examples/js
var craft = {};
var master = false;
var tmpQuaternion = new THREE.Quaternion();
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var controlsEnabled = false;
var stopnow = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var up = false;
var down = false;
var trackedObjects = {};
var pool_in_use = [], pool_store = [];
var mycraftmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
var othercraftmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xed4710, flatShading: false, vertexColors: THREE.VertexColors }), 0.6, 0.3);
var craftgeom = new THREE.CylinderGeometry(2, 2, 12, 8);
var builddd = new Physijs.SphereMesh(new THREE.SphereGeometry(5, 8, 8), othercraftmaterial)
var mybuilddd = new Physijs.SphereMesh(new THREE.SphereGeometry(5, 8, 8), mycraftmaterial)

if (havePointerLock) {//code to setup pointer lock
    "use strict";
    var element = document.body;
    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controlsEnabled = true;
            controls.enabled = true;
            blocker.style.display = 'none';
        } else {
            controls.enabled = false;
            blocker.style.display = 'block';
            instructions.style.display = '';
        }
    };
    var pointerlockerror = function (event) { instructions.style.display = ''; };
    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);
    instructions.addEventListener('click', function (event) {
        instructions.style.display = 'none';
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
    }, false);
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API try using the latest version of chrome';
}

var myBmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
var otherBmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);

var velocity = new THREE.Vector3();

function staticinit(objs) {
    scene = new Physijs.Scene;
    "use strict";
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 3000);
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);


    craft = mybuilddd.clone()
    var gun = new Physijs.CylinderMesh(craftgeom, mycraftmaterial)
    var matsdf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
    gun.rotation.setFromRotationMatrix(matsdf)
    gun.position.set(0, 0, -3)
    craft.add(gun);


    craft.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    craft.castShadow = true;

    //handleCollision = function (collided_with, linearVelocity, angularVelocity) { }
    //craft.addEventListener('collision', handleCollision);

    craft.setLinearVelocity(new THREE.Vector3(0, 0, 0))
    craft.position.set(Math.floor(Math.random() * 20 - 10) * 20, Math.floor(Math.random() * 20) * 20 + 10, Math.floor(Math.random() * 20 - 10) * 20)
    craft.add(camera);

    let o = new Uint32Array(1);
    window.crypto.getRandomValues(o)
    craft.uuid = o[0]

    controls = new THREE.PointerLockControls(craft);
    scene.add(craft);

    let crft = {
        tipe: "craft",
        vel: craft._physijs.linearVelocity,
        pos: craft.position,
        rot: craft.rotation,
        rotvel: craft._physijs.angularVelocity,
        uuid: craft.uuid,
        helt: craft.health,
        self: craft,
        me: true
    };
    trackedObjects[craft.uuid] = crft
    console.log("craft")
    console.log(crft)

    if (objs != null) {
        connection.send(JSON.stringify({ "task": "addcraft", "data": crft }))
        //connection.send(arraybuffer)
        console.log("not master soidvjbeo")
        //addCraftTscene(crft)
    }

    console.log(controls.getcamera())
    function wallll() {
        var floorGeometry = new THREE.BoxGeometry(1000, 1, 1000);
        for (var i = 0, l = floorGeometry.vertices.length; i < l; i++) {
            var vertex = floorGeometry.vertices[i];
            vertex.x += Math.random() * 20 - 10;
            vertex.y += Math.random() * 2;
            vertex.z += Math.random() * 20 - 10;
        }
        for (var i = 0, l = floorGeometry.faces.length; i < l; i++) {
            var face = floorGeometry.faces[i];
            face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        }
        return floorGeometry
    }


    scene.setGravity(new THREE.Vector3(0, 0, 0));

    ground_material = Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }),
        .8, // high friction
        .3 // low restitution
    );

    ground = new Physijs.BoxMesh(wallll(), ground_material, 0);
    ground.receiveShadow = true;
    scene.add(ground);

    ground = new Physijs.BoxMesh(new THREE.BoxGeometry(1000, 1, 1000), ground_material, 0);
    ground.receiveShadow = true;
    ground.position.y = 400;
    scene.add(ground);

    celing = new Physijs.BoxMesh(new THREE.BoxGeometry(1, 1000, 1000), ground_material, 0);
    celing.receiveShadow = true;
    celing.position.x = 400
    scene.add(celing);

    celing = new Physijs.BoxMesh(new THREE.BoxGeometry(1, 1000, 1000), ground_material, 0);
    celing.receiveShadow = true;
    celing.position.x = -400
    scene.add(celing);

    celing = new Physijs.BoxMesh(new THREE.BoxGeometry(1000, 1000, 1), ground_material, 0);
    celing.receiveShadow = true;
    celing.position.z = 400
    scene.add(celing);

    celing = new Physijs.BoxMesh(new THREE.BoxGeometry(1000, 1000, 1), ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.z = -400
    scene.add(celing);
    //console.log(scene.children)
}

function init2(objs) {
    staticinit(objs);
    "use strict";
    var box_geometry_target = new THREE.BoxGeometry(20, 20, 20)
    function handleCollisiontarget(collided_with, linearVelocity, angularVelocity, contact_normal) {
        if (collided_with.dealDamage === true) {
            var dif = (this._physijs.linearVelocity.clone().add(linearVelocity.clone())).length()
            this.health -= ((dif) / (this._physijs.mass / collided_with._physijs.mass));
            if (Math.round(this.health) != Math.round(this.startingHealth)) {
                switch (Math.round(((this.health / this.startingHealth) * 6))) {
                    case 1: this.material.color.setHex(0xcc8855); break;
                    case 2: this.material.color.setHex(0xbb9955); break;
                    case 3: this.material.color.setHex(0xaaaa55); break;
                    case 4: this.material.color.setHex(0x99bb55); break;
                    case 5: this.material.color.setHex(0x88cc55); break;
                    case 6: this.material.color.setHex(0x77dd55); break;
                }
            }
        }
        this.recentcolosion = true
        if (this.health < 0) {
            removefromscene(this);
            scene.remove(this);
        }
        if (master) { updatebyUUid(this, "BoxGeometry") }
    }
    createBoxtarget = function (health, pos, vel, rot, rotvel, uuid) {
        var box, material;
        material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
        box = new Physijs.BoxMesh(box_geometry_target, material);
        box.health = health;
        box.startingHealth = 100;
        if (pos == null) {
            box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
            box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
            box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        } else { box.position.x = pos.x; box.position.y = pos.y; box.position.z = pos.z; }
        if (rot == null) { box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI); }
        else { box.rotation.set(rot._x, rot._y, rot._z); }
        box.castShadow = true;
        if (uuid != null) {
            box.uuid = uuid
        }
        else {
            var o = new Uint32Array(1);
            window.crypto.getRandomValues(o)
            box.uuid = o[0]
        }
        //console.log(box.health== box.startingHealth,box.health, box.startingHealth)
        if (Math.round(box.health) != Math.round(box.startingHealth)) {
            switch (Math.round(((box.health / box.startingHealth) * 6))) {
                case 1: box.material.color.setHex(0xcc8855); break;
                case 2: box.material.color.setHex(0xbb9955); break;
                case 3: box.material.color.setHex(0xaaaa55); break;
                case 4: box.material.color.setHex(0x99bb55); break;
                case 5: box.material.color.setHex(0x88cc55); break;
                case 6: box.material.color.setHex(0x77dd55); break;
            }
        }


        box.addEventListener('collision', handleCollisiontarget);
        scene.add(box);
        //box.Id = box.uuid;
        if (vel != null) { box.setLinearVelocity(vel) }
        if (rotvel != null) { box.setAngularVelocity(rotvel) }
        trackedObjects[box.uuid] = {
            tipe: "BoxGeometry",
            vel: box._physijs.linearVelocity,
            pos: box.position,
            rot: box.rotation,
            rotvel: box._physijs.angularVelocity,
            uuid: box.uuid,
            helt: box.health,
            self: box
        }
    }
    //console.log("ervfuysagdibuhnoicjiadnovhbybu")
    if (objs == null) {
        for (var i = 0; i < 100; i++) {
            createBoxtarget(100, null, null, null, null, null)
        }
        start();
    } else {
        console.log(Object.keys(objs).length)
        console.log(Object.keys(objs))
        console.log(objs)
        for (bock in objs) {
            var bocks = objs[bock]
            if (bocks == null) { console.log(bock); continue; }
            if (bocks.tipe == "BoxGeometry") {
                createBoxtarget(bocks.helt + 0.1, bocks.pos, bocks.vel, bocks.rot, bocks.rotvel, bocks.uuid)
            } else if (bocks.tipe == "craft") {
                addcraft(bocks)
                console.log("############other craftr")
            }

        }
    }


    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onDocumentmousedown, false);
    console.log("is master " + master)
    //console.log(scene.children)
}///////////innit   ************************************************************************************************************#################################

function createscene(obj) {
    "use strict";
    console.log("create scene")
    if (obj == null) {
        master = true;
        console.log("scnen null is master")
    }
    init2(obj)
    animate()
}

function updateobj(update) {
    "use strict";
    let obj = trackedObjects[update.id];
    //console.log(obj)
    if (obj == null) {
        // console.log(update)
        return;
    }
    //console.log(update)
    let that = obj.self;
    //console.log(that)
    that.__dirtyPosition = true;
    that.position.x = update.pos.x
    that.position.y = update.pos.y
    that.position.z = update.pos.z
    that.__dirtyRotation = true;
    that.rotation.set(update.rot.x, update.rot.y, update.rot.z);
    that.health = update.helt
    that.__dirtyVelocity = true;
    that.setLinearVelocity(new THREE.Vector3(update.vel.x, update.vel.y, update.vel.z))
    that.setAngularVelocity(new THREE.Vector3(update.rotvel.x, update.rotvel.y, update.rotvel.z))

    if (that.health == that.startingHealth) { return; }
    switch (Math.round(((that.health / that.startingHealth) * 6))) {
        case 1: that.material.color.setHex(0xcc8855); break;
        case 2: that.material.color.setHex(0xbb9955); break;
        case 3: that.material.color.setHex(0xaaaa55); break;
        case 4: that.material.color.setHex(0x99bb55); break;
        case 5: that.material.color.setHex(0x88cc55); break;
        case 6: that.material.color.setHex(0x77dd55); break;
    }
}



function addcraft(coft) {
    //console.log(coft)
    "use strict";
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
    //var othercraft = new Physijs.BoxMesh(craftgeom, material);
    //othercraft.add(builddd);

    var othercraft = builddd.clone()
    var gun = new Physijs.CylinderMesh(craftgeom, othercraftmaterial)
    var matsdf = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI * 0.5)
    gun.rotation.setFromRotationMatrix(matsdf)
    gun.position.set(0, 0, -3)
    //console.log(gun)
    othercraft.add(gun);
    othercraft.material.color.setHex(0xed4710)

    othercraft.rotation.set(coft.rot._x, coft.rot._y, coft.rot._z);
    othercraft.castShadow = true;

    othercraft.setLinearVelocity(new THREE.Vector3(coft.vel.x, coft.vel.y, coft.vel.z))
    othercraft.position.set(coft.pos.x, coft.pos.y, coft.pos.z)

    othercraft.uuid = coft.uuid
    console.log("new craft " + othercraft)
    //console.log(othercraft)

    scene.add(othercraft);

    trackedObjects[othercraft.uuid] = {
        tipe: "craft",
        vel: othercraft._physijs.linearVelocity,
        pos: othercraft.position,
        rot: othercraft.rotation,
        rotvel: othercraft._physijs.angularVelocity,
        uuid: othercraft.uuid,
        helt: othercraft.health,
        self: othercraft,
        me: false
    }
    //trackedObjects[obj.data.uuid].self = othercraft;

}


function onWindowResize() {
    "use strict";
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function onDocumentmousedown(event) {
    "use strict";
    //console.log(event.button,event.button,event.timeStamp)
    if (event.button == 0) { single(400000, 400, event, 500) }
    if (event.button == 1) { grenade(250000, 50, event, 150) }
    if (event.button == 2) { shotgun(400000, 200, 10, event, 350) }
    //for (var obj in scene.children) {
    // console.log(scene.children[obj].uuid)
    // }
}


function grenade(total, speed, event, range) {
    "use strict";
    event.preventDefault();
    let time = (range / speed) * 1000
    function handleCollisiong(collided_with, linearVelocity, angularVelocity) {
        scene.remove(this);
        //removebullettss(this)
        console.log("ekusplotion")
        explosion(this.position, 100, this.mass);
        //scene.remove(this)   //console.log(collided_with)
    }
    function removebullett(box) {
        if (box.parent === scene) {
            let center = box.position;
            scene.remove(box);
            //removebullettss(box)
            console.log("ekusplotion")
            explosion(center, 100, box.mass * 3);
        }
    }

    event.preventDefault();
    let boxes = [];
    let diree = getdirection()
    let box_geometry = new THREE.SphereGeometry(5, 8, 8)
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    let vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    let cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    let ofset = diree.clone().normalize().multiplyScalar(15)
    let position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    let bbx = makeprojectile(position, vel, (total / speed), null, box_geometry, myBmaterial, 5, time)
    boxes.push(bbx);
    maketransit(boxes)
    bbx.addEventListener('collision', handleCollisiong);
    setTimeout(removebullett.bind(null, bbx), time);
}

function explosion(positionor, numobjects, totalmass) {
    "use strict";
    let time = (200 / 400) * 1000
    let boxes = []
    let box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    for (let i = 0; i < numobjects; i++) {
        let ofset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
        let position = new THREE.Vector3(positionor.x + ofset.x, positionor.y + ofset.y, positionor.z + ofset.z)
        //velocity = new THREE.Vector3((Math.random() * 800) - 400, (Math.random() * 800) - 400, (Math.random() * 800) - 400);
        let velocity = position.clone().sub(positionor).normalize().multiplyScalar(400)
        boxes.push(makeprojectile(position, velocity, (totalmass / numobjects), null, box_geometry, myBmaterial, 0.5, time));
    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { for (let key in boxes) { removebullettss(boxes[key]) /*scene.remove(boxes[key])*/ } }
}

function shotgun(total, speed, pelets, event, range) {
    "use strict";
    let time = (range / speed) * 1000
    event.preventDefault();
    let diree = getdirection()
    let box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    let cvel = craft._physijs.linearVelocity.clone()
    let boxes = []
    for (let i = 0; i < pelets; i++) {
        let ofset = diree.clone().normalize().multiplyScalar(15).add(new THREE.Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1))
        let position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
        let vel = diree.clone().normalize().multiplyScalar(speed).add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
        vel.add(cvel)
        boxes.push(makeprojectile(position, vel, ((total / pelets) / speed), null, box_geometry, myBmaterial, 0.5, time));
    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { for (let key in boxes) { removebullettss(boxes[key]) /*scene.remove(boxes[key])*/ } }
}

function single(total, speed, event, range) {
    "use strict";
    let time = (range / speed) * 1000
    event.preventDefault();
    let boxes = [];
    let diree = getdirection()
    let box_geometry = new THREE.SphereGeometry(2, 8, 8)
    let vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    let cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    let ofset = diree.clone().normalize().multiplyScalar(15)
    let position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    boxes.push(makeprojectile(position, vel, (total / speed), time, box_geometry, myBmaterial, 2, time));
    maketransit(boxes)
}

function removebullettss(tmp) {
    "use strict";
    //tmp.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    //tmp.setAngularVelocity(new THREE.Vector3(0, 0, 0));
    //tmp.__dirtyPosition = true;
    //tmp.position.x = (Math.random() * 1000) +6000
    //tmp.position.y = (Math.random() * 1000) +6000
    //tmp.position.z = (Math.random() * 1000) +6000
    //tmp._physijs.position.x = tmp.position.x
    //tmp._physijs.position.y = tmp.position.y
    //tmp._physijs.position.z = tmp.position.z
    pool_store.push(tmp);
    scene.remove(tmp)
    //console.log(tmp)
    //for (i in pool_in_use){
    //    if (tmp.uuid==pool_in_use[i].uuid){
    //        avdoih=pool_in_use.splice(i,1);
    //        pool_store.push(avdoih[0]);
    //        break;
    //    }
    // }
}

function makeprojectile(position, velocity, mass, time, geomitty, material, radius, timeout) {
    "use strict";
    let tmp, meetsneeds = false;
    for (let index = 0; index < pool_store.length; index++) {
        if (pool_store[index].rad === radius) {
            tmp = pool_store.splice(index, 1)[0];
            meetsneeds = true;
            break;
        }
    }

    if (meetsneeds) {
        //console.log(tmp)
        tmp.mass = mass;
        //tmp.__dirtyPosition = true;
        tmp.position.x = position.x;
        tmp.position.y = position.y;
        tmp.position.z = position.z;
        //tmp._physijs.position.x = position.x;
        //tmp._physijs.position.y = position.y;
        //tmp._physijs.position.z = position.z;
        tmp.vel = velocity;
        tmp.timeout = timeout
        scene.add(tmp);
        tmp.setLinearVelocity(velocity);
        tmp.material.color.setHex(0xffffff)
        if (time != null) {
            setTimeout(removebullettss.bind(null, tmp), time);
            //pool_in_use.push(tmp)
        }
        return tmp;
    }


    let box = new Physijs.SphereMesh(geomitty, material);
    box.dealDamage = true;
    box.castShadow = true;
    box.mass = mass;
    box.__dirtyPosition = true;
    box.position.x = position.x;
    box.position.y = position.y;
    box.position.z = position.z;
    //tmp._physijs.position.x = position.x;
    // tmp._physijs.position.y = position.y;
    //tmp._physijs.position.z = position.z;
    box.dim = { r: radius };
    box.rad = radius
    box.vel = velocity;
    box.timeout = timeout
    let o = new Uint32Array(1);
    window.crypto.getRandomValues(o);
    box.uuid = o[0];
    scene.add(box);
    box.setLinearVelocity(velocity);
    if (time != null) {
        setTimeout(removebullettss.bind(null, box), time);
        pool_in_use.push(box)
    }
    box.material.color.setHex(0xffffff)
    return box;
}


function getdirection() {
    "use strict";
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects(scene.children);
    return intersects[0].point.sub(craft.position)
}



function animate() {
    "use strict";
    requestAnimationFrame(animate);
    let mat = new THREE.Matrix4().makeScale(.975, .975, .975)
    for (let uuid in trackedObjects) {
        let obj = trackedObjects[uuid];

        if (obj.tipe === "craft") {
            continue;
        }
        let vel = obj.self._physijs.linearVelocity;
        let rotvel = obj.self._physijs.angularVelocity;
        vel.applyMatrix4(mat);
        rotvel.applyMatrix4(mat);
        obj.self.setLinearVelocity(vel);
        obj.self.setAngularVelocity(rotvel)
        if (vel.length() > 1 || rotvel.length() > 1) {

            //obj.self.setLinearVelocity(new THREE.Vector3(0, 0, 0))
            if (master) {
                updatebyUUid(obj.self, "BoxGeometry")
            } else if (obj.recentcolosion == true) {
                obj.recentcolosion = false
                console.log(vel)
                updatebyUUid(obj.self, "BoxGeometry")
            }
        }
    }
    if (controlsEnabled === true) {

        let velocity = craft._physijs.linearVelocity

        let tmpmove = new THREE.Vector3(0, 0, 0);
        if (moveForward) tmpmove.z = 1;
        if (moveBackward) tmpmove.z = -1;

        if (moveRight) tmpmove.x = -0.5;
        if (moveLeft) tmpmove.x = 0.5;

        if (up) tmpmove.y = -0.5;
        if (down) tmpmove.y = 0.5;
        craft.__dirtyPosition = true;
        craft.__dirtyVelocity = true;
        craft.__dirtyRotation = true;
        if (stopnow) {
            var m41 = new THREE.Matrix4();
            if (velocity.length() < 2) {//if the craft speed is below this use a scale to slow it to a stop
                m41.makeScale(.9, .9, .9);
                velocity.applyMatrix4(m41);
            } else {
                if (velocity.x < 0) velocity.x += .5; else velocity.x += -.5;
                if (velocity.y < 0) velocity.y += .5; else velocity.y += -.5;
                if (velocity.z < 0) velocity.z += 1; else velocity.z += -1;
            }
        }

        craft.rotation.setFromQuaternion(controls.getObject().quaternion)
        tmpmove.applyQuaternion(craft.quaternion);
        velocity.x -= tmpmove.x;
        velocity.z -= tmpmove.z;
        velocity.y -= tmpmove.y;

        craft.setLinearVelocity(velocity)
        controls.updateRotationVector();
        updatebyUUid(craft, "craft")
    }
    scene.simulate();
    renderer.render(scene, camera);
}


function maketransit(objs) {
    "use strict";
    let buffer = new ArrayBuffer();
    for (let objnum in objs) {
        let obj = objs[objnum]
        let firs56 = tobytes(obj.position, obj.vel, obj.rotation, obj._physijs.angularVelocity, obj.health, obj.uuid, 4)
        let las16 = objtipetoByte("sphere", obj.dim, obj.timeout, obj.mass)
        //var tmp = appendBuffer(firs56, las16)
        //buffer = appendBuffer(buffer, tmp)
        /*
                        var las16 = new ArrayBuffer(16)
                        var tmp = new Uint32Array(buffer)
                        tmp[0] = 2;
                        tmp[2] = obj.timeout;
                        tmp[3] = obj.mass;
                        tmp = new Float32Array(buffer);
                        tmp[1] = obj.dim.r;
                //*/
        var tmp = new Uint8Array(firs56.byteLength + las16.byteLength);
        tmp.set(new Uint8Array(firs56), 0);
        tmp.set(new Uint8Array(las16), firs56.byteLength);
        var tmp2 = new Uint8Array(buffer.byteLength + tmp.buffer.byteLength);
        tmp2.set(new Uint8Array(buffer), 0);
        tmp2.set(new Uint8Array(tmp.buffer), buffer.byteLength);

        buffer = tmp2.buffer
        //*/
    }
    connection.send(buffer)
    //sendbytts(buffer)
}

function appendBuffer(buffer1, buffer2) {
    "use strict";
    let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

function makebullete(objs) {
    "use strict";

    let boxes = [], time = 0;
    for (let id in objs) {
        let objj = objs[id];
        time = objj.tim
        let box_geometry = new THREE.SphereGeometry(objj.r, 8, 8)
        let bull = makeprojectile(objj.pos, objj.vel, objj.mas, null, box_geometry, otherBmaterial, objj.r, objj.tim)
        bull.material.color.setHex(0xed4710)
        boxes.push(bull)
    }
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { for (let key in boxes) { removebullettss(boxes[key]) /*scene.remove(boxes[key])*/ } }

}

function removeFromSceneById(id) {
    "use strict";
    console.log("rm -uuid " + id)
    let obj = trackedObjects[id];
    //console.log(obj)
    if (obj == null) { console.log("trying to remove null object"); return }
    try {
        scene.remove(obj.self)
    } catch (err) { console.log(err) }
}