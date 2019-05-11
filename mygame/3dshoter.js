Physijs.scripts.worker = 'Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'Physijs/examples/js/ammo3.js';
var camera, scene, renderer, controls;
//Physijs/Physijs/examples/js
var craft;
var master = false;
//var arrowHelper
var raycaster;
var tmpQuaternion = new THREE.Quaternion();
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var trackedObjects = {};
var uuidcount = 1
if (havePointerLock) {
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
    var pointerlockerror = function (event) {
        instructions.style.display = '';
    };
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
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
}

//init();
//animate();

var controlsEnabled = false;
var stopnow = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var up = false;
var down = false;
var canJump = false;
var myBmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
var otherBmaterial = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();


function staticinit(objs) {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new Physijs.Scene;
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 300);
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    var craftgeom = new THREE.BoxGeometry(5, 5, 5);
    var material = Physijs.createMaterial( new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
    craft = new Physijs.BoxMesh(craftgeom, material);

    craft.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    craft.castShadow = true;

    handleCollision = function (collided_with, linearVelocity, angularVelocity) {
        //console.log("craft")
        //console.log(collided_with)
    }

    craft.addEventListener('collision', handleCollision);
    console.log("craft")
    console.log(craft)

    craft.setLinearVelocity(new THREE.Vector3(0, 0, 0))
    craft.position.set(Math.floor(Math.random() * 20 - 10) * 20, Math.floor(Math.random() * 20) * 20 + 10, Math.floor(Math.random() * 20 - 10) * 20)
    craft.add(camera);

    var o = new Uint32Array(1);
    window.crypto.getRandomValues(o)
    craft.uuid = o[0]
    console.log(craft)

    controls = new THREE.PointerLockControls(craft);
    //scene.add(controls.getObject());
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
        me:true
    };
    trackedObjects[craft.uuid] = crft

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

    ground = new Physijs.BoxMesh( wallll(), ground_material, 0  );
    ground.receiveShadow = true;
    scene.add(ground);

    ground = new Physijs.BoxMesh( new THREE.BoxGeometry(1000, 1, 1000), ground_material,  0  );
    ground.receiveShadow = true;
    ground.position.y = 400;
    scene.add(ground);

    celing = new Physijs.BoxMesh( new THREE.BoxGeometry(1, 1000, 1000), ground_material,  0 );
    celing.receiveShadow = true;
    celing.position.x = 400
    scene.add(celing);

    celing = new Physijs.BoxMesh( new THREE.BoxGeometry(1, 1000, 1000), ground_material, 0 );
    celing.receiveShadow = true;
    celing.position.x = -400
    scene.add(celing);

    celing = new Physijs.BoxMesh( new THREE.BoxGeometry(1000, 1000, 1), ground_material, 0 );
    celing.receiveShadow = true;
    celing.position.z = 400
    scene.add(celing);

    celing = new Physijs.BoxMesh( new THREE.BoxGeometry(1000, 1000, 1), ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.z = -400
    scene.add(celing);
    //console.log(scene.children)
}

function init2(objs) {
    staticinit(objs)
    var box_geometry_target = new THREE.BoxGeometry(20, 20, 20)
    handleCollisiontarget = function (collided_with, linearVelocity, angularVelocity, contact_normal) {
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
        //console.log(collided_with._physijs.linearVelocity)
        //console.log(linearVelocity)
        //console.log(this._physijs.linearVelocity)
        this.recentcolosion = true
        if (this.health < 0) {
            removefromscene(this);
            scene.remove(this);
        }
        //if("notmine" in collided_with){return}
        if (master) {
            updatebyUUid(this, "BoxGeometry")
        }

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
        for (bock in objs) {
            var bocks = objs[bock]
            if (bocks == null) { console.log(bock); continue; }
            if (bocks.tipe == "BoxGeometry") {
                createBoxtarget(bocks.helt + 0.1, bocks.pos, bocks.vel, bocks.rot, bocks.rotvel, bocks.uuid)
            }else if(bocks.tipe == "craft"){
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
    mouse = new THREE.Vector2();
    console.log("is master " + master)
    //console.log(scene.children)
}///////////innit   ************************************************************************************************************#################################

function createscene(obj) {
    console.log("create scene")
    if (obj == null) {
        master = true;
        console.log("scnen null is master")
    }//else {
    //    master = false;
    //}
    init2(obj)
    animate()
}

function updateobj(update) {
    //console.log(update)
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
/*
function updatescene(objs) {
    console.log(objs)
    for (key in objs) {
        update = objs[key]
        let obj = trackedObjects[update.uuid];
        //console.log(obj)
        let that = obj.self;
        that.__dirtyPosition = true;
        that.position.x = update.pos.x
        that.position.y = update.pos.y
        that.position.z = update.pos.z
        that.__dirtyRotation = true;
        that.rotation._x = update.rot._x
        that.rotation._y = update.rot._y
        that.rotation._z = update.rot._z
        that.health = update.helt
        //console.log(update.vel)
        that.__dirtyVelocity = true;
        that.setLinearVelocity(update.vel)
        console.log(update.pos, that.position)
        console.log(update.rotvel)
        that.setAngularVelocity(new THREE.Vector(update.rotvel.x, update.rotvel.y, update.rotvel.z));
        //that.setAngularVelocity(new THREE.Vector3(update.rotvel.x, update.rotvel.y, update.rotvel.z))

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
}
*/



function addcraft(coft) {
    //console.log(coft)
    var craftgeom = new THREE.BoxGeometry(5, 5, 5);
    var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
    var othercraft = new Physijs.BoxMesh(craftgeom, material);

    othercraft.rotation.set(coft.rot._x, coft.rot._y, coft.rot._z);
    othercraft.castShadow = true;
    /*
    handleCollision = function (collided_with, linearVelocity, angularVelocity) {
        //console.log("craft")
        //console.log(collided_with)
    }
    //coft.helt
    othercraft.addEventListener('collision', handleCollision);
*/

    othercraft.setLinearVelocity(new THREE.Vector3(coft.vel.x, coft.vel.y, coft.vel.z))
    othercraft.position.set(coft.pos.x, coft.pos.y, coft.pos.z)

    othercraft.uuid = coft.uuid
    console.log("new craft "+othercraft)
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function onDocumentmousedown(event) {
    //console.log(event.button,event.button,event.timeStamp)
    if (event.button == 0) { single(400000, 400, event, 400) }
    if (event.button == 1) { grenade(250000, 50, event, 150) }
    if (event.button == 2) { shotgun(400000, 200, 10, event, 250) }
    for (obj in scene.children) {
        // console.log(scene.children[obj].uuid)
    }
}


function grenade(total, speed, event, range) {
    event.preventDefault();
    time = (range / speed) * 1000
    handleCollision = function (collided_with, linearVelocity, angularVelocity) {
        scene.remove(this);
        explosion(this.position, 100, this.mass);
        //scene.remove(this)   //console.log(collided_with)
    }
    function removebullett(box) {
        if (box.parent === scene) {
            var center = box.position;
            scene.remove(box);
            explosion(center, 100, box.mass * 3);
        }
    }

    event.preventDefault();
    boxes = [];
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(5, 8, 8)
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    var cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    var ofset = diree.clone().normalize().multiplyScalar(10)
    var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    var bbx = makeprojectile(position, vel, (total / speed), null, box_geometry, myBmaterial, 5, time)
    boxes.push(bbx);
    maketransit(boxes)
    bbx.addEventListener('collision', handleCollision);
    setTimeout(removebullett.bind(null, box), time);
}

function explosion(positionor, numobjects, totalmass) {
    time = (200 / 400) * 1000
    let boxes = []
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);

    for (var i = 0; i < numobjects; i++) {
        var ofset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
        var position = new THREE.Vector3(positionor.x + ofset.x, positionor.y + ofset.y, positionor.z + ofset.z)
        //velocity = new THREE.Vector3((Math.random() * 800) - 400, (Math.random() * 800) - 400, (Math.random() * 800) - 400);
        let velocity = position.clone().sub(positionor).normalize().multiplyScalar(400)
        ////////////////#################################////////////////#################################////////////////#################################
        box = new Physijs.SphereMesh(box_geometry, myBmaterial);
        box.dealDamage = true;
        box.castShadow = true;
        box.mass = totalmass / numobjects;
        box.position.x = position.x;
        box.position.y = position.y;
        box.position.z = position.z;
        box.dim = { r: .5 };
        box.vel = velocity;
        box.timeout = time

        var o = new Uint32Array(1);
        window.crypto.getRandomValues(o);
        box.uuid = o[0];
        scene.add(box);
        box.setLinearVelocity(velocity);
        boxes.push(box)
        //boxes.push(makeprojectile(position, velocity, (totalmass / numobjects), null, box_geometry, material, 0.5,time));
        ////////////////#################################////////////////#################################////////////////#################################
    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { for (key in boxes) { scene.remove(boxes[key]) } }
}

function shotgun(total, speed, pelets, event, range) {
    time = (range / speed) * 1000
    event.preventDefault();
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    var cvel = craft._physijs.linearVelocity.clone()
    let boxes = []
    for (var i = 0; i < pelets; i++) {
        var ofset = diree.clone().normalize().multiplyScalar(10).add(new THREE.Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1))
        var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
        vel = diree.clone().normalize().multiplyScalar(speed).add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
        vel.add(cvel)
        boxes.push(makeprojectile(position, vel, ((total / pelets) / speed), null, box_geometry, myBmaterial, 0.5, time));

    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { for (key in boxes) { scene.remove(boxes[key]) } }
}

function single(total, speed, event, range) {
    time = (range / speed) * 1000
    event.preventDefault();
    boxes = [];
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(2, 8, 8)
    //var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    var cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    var ofset = diree.clone().normalize().multiplyScalar(10)
    var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    boxes.push(makeprojectile(position, vel, (total / speed), time, box_geometry, myBmaterial, 2, time));
    maketransit(boxes)
}


function makeprojectile(position, velocity, mass, time, geomitty, material, radius, timeout) {
    box = new Physijs.SphereMesh(geomitty, material);
    box.dealDamage = true;
    box.castShadow = true;
    box.mass = mass;
    box.position.x = position.x;
    box.position.y = position.y;
    box.position.z = position.z;
    box.dim = { r: radius };
    box.vel = velocity;
    box.timeout = timeout
    if (time != null) {
        setTimeout(removebullett.bind(null, box), time);
        function removebullett(box) { /*console.log(box);*/ scene.remove(box); }
    }
    var o = new Uint32Array(1);
    window.crypto.getRandomValues(o);
    box.uuid = o[0];
    scene.add(box);
    box.setLinearVelocity(velocity);
    return box;
}


function getdirection() {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    return intersects[0].point.sub(craft.position)
}



function animate() {
    requestAnimationFrame(animate);
    mat = new THREE.Matrix4().makeScale(.975, .975, .975)
    for (uuid in trackedObjects) {
        let obj = trackedObjects[uuid];
        
        if(obj.tipe==="craft"){
            if (obj.me){
                if (controlsEnabled === true) {
                    
                    velocity = obj.self._physijs.linearVelocity
            
                    var tmpmove = new THREE.Vector3(0, 0, 0);
                    if (moveForward) tmpmove.z = 1;
                    if (moveBackward) tmpmove.z = -1;
            
                    if (moveRight) tmpmove.x = -0.5;
                    if (moveLeft) tmpmove.x = 0.5;
            
                    if (up) tmpmove.y = -0.5;
                    if (down) tmpmove.y = 0.5;
                    obj.self.__dirtyPosition = true;
                    obj.self.__dirtyVelocity = true;
                    obj.self.__dirtyRotation = true;
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
            
                    obj.self.rotation.setFromQuaternion(controls.getObject().quaternion)
                    tmpmove.applyQuaternion(obj.self.quaternion);
                    velocity.x -= tmpmove.x;
                    velocity.z -= tmpmove.z;
                    velocity.y -= tmpmove.y;
            
                    obj.self.setLinearVelocity(velocity)
                    controls.updateRotationVector();
                    updatebyUUid(obj.self, "craft")
                }
            }
            //console.log(obj.tipe);
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
    
    scene.simulate();
    renderer.render(scene, camera);
}


function maketransit(objs = []) {
    var buffer = new ArrayBuffer()
    for (objnum in objs) {
        obj = objs[objnum]
        var firs56 = tobytes(obj.position, obj.vel, obj.rotation, obj._physijs.angularVelocity, obj.health, obj.uuid, 4)
        var las16 = objtipetoByte("sphere", obj.dim, obj.timeout, obj.mass)
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
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

function makebullete(objs) {
    boxes = [];
    for (id in objs) {
        objj = objs[id];
        //console.log(objj)
        var box_geometry = new THREE.SphereGeometry(objj.r, 8, 8)
        //var material = Physijs.createMaterial( new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }),.95, .3  );
        var box = new Physijs.SphereMesh(box_geometry, otherBmaterial);

        box.position.x = objj.pos.x;
        box.position.y = objj.pos.y;
        box.position.z = objj.pos.z;
        box.mass = objj.mas;
        box.notmine = true;
        if (master) {
            box.dealDamage = true;
        }
        box.castShadow = true;
        box.uuid = objj.id
        //setTimeout(removebullett.bind(null, box), objj.tim);
        //function removebullett(box) {scene.remove(box); }

        scene.add(box);
        box.setLinearVelocity(new THREE.Vector3(objj.vel.x, objj.vel.y, objj.vel.z))
        boxes.push(box)
    }
    setTimeout(removebullett.bind(null, boxes), objj.tim);
    function removebullett(boxes) { for (key in boxes) { scene.remove(boxes[key]) } }
    try {

    } catch (err) {
        console.log(boxes)
    }

}

function removeFromSceneById(id) {
    console.log("rm -uuid "+id)
    let obj = trackedObjects[id];
    //console.log(obj)
    if (obj == null) { console.log("trying to remove null object"); return }
    try {
        scene.remove(obj.self)
    } catch (err) { console.log(err) }
}