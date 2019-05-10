Physijs.scripts.worker = 'Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'Physijs/examples/js/ammo3.js';
var camera, scene, renderer, controls;
//Physijs/Physijs/examples/js
var craft;
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

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();


function staticinit() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new Physijs.Scene;
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 300);
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);

    var craftgeom = new THREE.BoxGeometry(5, 5, 5);
    var material;
    material = Physijs.createMaterial(
        new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }),
        //new THREE.MeshLambertMaterial({ map: loader.load('images/plywood.jpg') }),
        .6, // medium friction
        .3 // low restitution
    );
    craft = new Physijs.BoxMesh(
        craftgeom,
        material
    );
    craft.collisions = 0;

    craft.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    craft.castShadow = true;
    handleCollision = function (collided_with, linearVelocity, angularVelocity) {
        //console.log("craft")
        //console.log(collided_with)
    }
    craft.addEventListener('collision', handleCollision);
    console.log("craft")
    console.log(craft)
    craft.__dirtyPosition = true;
    craft.__dirtyVelocity = true;
    craft.__dirtyRotation = true;
    craft.setLinearVelocity(new THREE.Vector3(0, 0, 0))
    craft.setLinearVelocity(new THREE.Vector3(0, 0, 0))
    craft.setLinearVelocity(new THREE.Vector3(0, 0, 0))
    craft.position.set(0, 10, 0)
    //camera.position.set(0, 10, 10)
    craft.add(camera);
    //trackedObjects.push({
    //   type: "craft",
    //    vel: craft._physijs.linearVelocity,
    //    pos: craft.position
    // })
    console.log(craft)

    controls = new THREE.PointerLockControls(craft);
    //scene.add(controls.getObject());
    scene.add(craft);
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
    ground = new Physijs.BoxMesh(
        wallll(),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;
    scene.add(ground);
    ground = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1000, 1, 1000),
        ground_material,
        0 // mass
    );
    ground.receiveShadow = true;
    ground.position.y = 400;
    scene.add(ground);
    celing = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1, 1000, 1000),
        ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.x = 400
    scene.add(celing);
    celing = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1, 1000, 1000),
        ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.x = -400
    scene.add(celing);
    celing = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1000, 1000, 1),
        ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.z = 400
    scene.add(celing);
    celing = new Physijs.BoxMesh(
        new THREE.BoxGeometry(1000, 1000, 1),
        ground_material,
        0 // mass
    );
    celing.receiveShadow = true;
    celing.position.z = -400
    scene.add(celing);

}

function init2(objs) {
    staticinit()
    var box_geometry_target = new THREE.BoxGeometry(20, 20, 20)
    handleCollisiontarget = function (collided_with, linearVelocity, angularVelocity, contact_normal) {
        if (collided_with.dealDamage === true) {
            var dif = (this._physijs.linearVelocity.clone().add(linearVelocity.clone())).length()
            this.health -= ((dif) / (this._physijs.mass / collided_with._physijs.mass));

            switch (Math.round(((this.health / this.startingHealth) * 6))) {
                case 1: this.material.color.setHex(0xcc8855); break;
                case 2: this.material.color.setHex(0xbb9955); break;
                case 3: this.material.color.setHex(0xaaaa55); break;
                case 4: this.material.color.setHex(0x99bb55); break;
                case 5: this.material.color.setHex(0x88cc55); break;
                case 6: this.material.color.setHex(0x77dd55); break;
            }
        }
        if (this.health < 0) {
            removefromscene(this);
            scene.remove(this);
        }
        //console.log(this.health)
        if("notmine" in collided_with){return}
        updatebyUUid(this, "BoxGeometry")
    }
    createBoxtarget = function (health, pos, vel, rot, rotvel, uuid) {
        var box, material;
        material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
        box = new Physijs.BoxMesh(box_geometry_target, material);
        box.health = health;
        box.startingHealth = health;
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
        box.addEventListener('collision', handleCollisiontarget);
        scene.add(box);
        //box.Id = box.uuid;
        if (vel != null) { box.setLinearVelocity(vel) }
        if (rotvel != null) { box.setAngularVelocity(rotvel) }
        trackedObjects[box.uuid] = {
            type: "BoxGeometry",
            vel: box._physijs.linearVelocity,
            pos: box.position,
            rot: box.rotation,
            rotvel: box._physijs.angularVelocity,
            uuid: box.uuid,
            helt: box.health,
            self: box
        }
    }
    if (objs == null) {
        for (var i = 0; i < 100; i++) {
            createBoxtarget(100, null, null, null, null, null)
        }
        doneinit();
    } else {
        console.log(Object.keys(objs).length)
        for (bock in objs) {
            var bocks = objs[bock]
            if (bocks == null) { console.log(bock); continue; }
            if (bocks.type != "craft") {
                if (bocks.type == "BoxGeometry") {
                    //console.log(bocks.uuid)
                    createBoxtarget(bocks.helt + 0.1, bocks.pos, bocks.vel, bocks.rot, bocks.rotvel, bocks.uuid)
                }
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

}///////////innit   ************************************************************************************************************#################################

function createscene(obj) {
    console.log("create scene")
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
    let that = obj.self;
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

function updatescene(objs) {
    console.log(objs)
    objs.forEach(update => {
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
    })
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


function onDocumentmousedown(event) {
    //console.log(event.button,event.button,event.timeStamp)
    if (event.button == 0) { single(400000, 400, event,400) }
    if (event.button == 1) { grenade(250000, 50, event,150) }
    if (event.button == 2) { shotgun(400000, 200, 10, event,250) }
    for (obj in scene.children) {
        // console.log(scene.children[obj].uuid)
    }
}


function grenade(total, speed, event,range) {
    event.preventDefault();
    time=(range/speed)*1000
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
    var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    var cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    var ofset = diree.clone().normalize().multiplyScalar(10)
    var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    var bbx = makeprojectile(position, vel, (total / speed), null, box_geometry, material, 5,time)
    boxes.push(bbx);
    maketransit(boxes)
    bbx.addEventListener('collision', handleCollision);
    setTimeout(removebullett.bind(null, box), time);
}

function explosion(position, numobjects, totalmass) {
    time=(200/400)*1000
    let boxes = []
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);

    for (var i = 0; i < numobjects; i++) {
        var ofset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
        var position = new THREE.Vector3(position.x + ofset.x, position.y + ofset.y, position.z + ofset.z)
        velocity = new THREE.Vector3((Math.random() * 800) - 400, (Math.random() * 800) - 400, (Math.random() * 800) - 400);
        boxes.push(makeprojectile(position, velocity, (totalmass / numobjects), null, box_geometry, material, 0.5,time));
    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { boxes.forEach(box => { scene.remove(box); }) }
}

function shotgun(total, speed, pelets, event,range) {
    time=(range/speed)*1000
    event.preventDefault();
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    var cvel = craft._physijs.linearVelocity.clone()
    let boxes = []
    for (var i = 0; i < pelets; i++) {
        var ofset = diree.clone().normalize().multiplyScalar(10).add(new THREE.Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1))
        var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
        vel = diree.clone().normalize().multiplyScalar(speed).add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
        vel.add(cvel)
        boxes.push(makeprojectile(position, vel, ((total / pelets) / speed), null, box_geometry, material, 0.5,time));

    }
    maketransit(boxes)
    setTimeout(removebullett.bind(null, boxes), time);
    function removebullett(boxes) { boxes.forEach(box => { scene.remove(box); }) }
}

function single(total, speed, event,range) {
    time=(range/speed)*1000
    event.preventDefault();
    boxes = [];
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(2, 8, 8)
    var material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
    vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
    var cvel = craft._physijs.linearVelocity.clone()
    vel.add(cvel)
    var ofset = diree.clone().normalize().multiplyScalar(10)
    var position = new THREE.Vector3(craft.position.x + ofset.x, craft.position.y + ofset.y, craft.position.z + ofset.z)
    boxes.push(makeprojectile(position, vel, (total / speed), time, box_geometry, material, 2,time));
    maketransit(boxes)
}


function makeprojectile(position, velocity, mass, time, geomitty, material, radius,timeout) {
    box = new Physijs.SphereMesh(geomitty, material);
    box.dealDamage = true;
    box.castShadow = true;
    box.mass = mass;
    box.position.x = position.x;
    box.position.y = position.y;
    box.position.z = position.z;
    box.dim = { r: radius };
    box.vel = velocity;
    box.timeout=timeout
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
    //console.log(arrowHelper)

    for (uuid in trackedObjects) {
        let obj = trackedObjects[uuid];
        let vel = obj.self._physijs.linearVelocity;
        let rotvel = obj.self._physijs.angularVelocity;
        mat = new THREE.Matrix4().makeScale(.98, .98, .98)
        vel.applyMatrix4(mat);
        rotvel.applyMatrix4(mat);
        obj.self.setLinearVelocity(vel);
        obj.self.setAngularVelocity(rotvel)
        if (obj.self._physijs.linearVelocity.length() > 3) {
            //obj.self.setLinearVelocity(new THREE.Vector3(0, 0, 0))
            updatebyUUid(obj.self, "BoxGeometry")
        }
    }
    if (controlsEnabled === true) {
        velocity = craft._physijs.linearVelocity

        var time = performance.now();
        var delta = (time - prevTime) / 1000;
        //*
        var tmpmove = new THREE.Vector3(0, 0, 0);
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

        //*/
        var mate = new THREE.Matrix4();
        //console.log(craft)
        mate.makeRotationFromQuaternion(controls.getquaternion());
        var rot = new THREE.Vector3(1, 0, 0).applyQuaternion(controls.getObject().quaternion)
        //craft.rotation.set(rot.x,rot.y,rot.z  );
        craft.rotation.setFromQuaternion(controls.getObject().quaternion)
        var tmp = craft.quaternion;
        var secondQuaternion = new THREE.Quaternion(-tmp.x, -tmp.y, -tmp.z, tmp.w);
        tmpmove.applyQuaternion(craft.quaternion);
        velocity.x -= tmpmove.x;
        velocity.z -= tmpmove.z;
        velocity.y -= tmpmove.y;

        craft.setLinearVelocity(velocity)
        controls.updateRotationVector();
        velocity.applyQuaternion(secondQuaternion);


        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);
        tmpmove.x *= (delta * 10);
        tmpmove.y *= (delta * 10);
        tmpmove.z *= (delta * 10);

        craft._physijs.linearVelocity.add(tmpmove)

        if (controls.getObject().position.y < 10) {
            velocity.y = 0;
            controls.getObject().position.y = 10;
            canJump = true;
        }
        prevTime = time;
    }
    scene.simulate();
    renderer.render(scene, camera);
}


function maketransit(objs = []) {
    var buffer = new ArrayBuffer()
    for (objnum in objs) {
        obj = objs[objnum]
        var firs56 = tobytes(obj.position, obj.vel, obj.rotation, obj._physijs.angularVelocity, obj.health, obj.uuid, 4)
        var las8 = objtipetoByte("sphere", obj.dim,obj.timeout,obj.mass)
        var tmp = appendBuffer(firs56, las8)
        buffer = appendBuffer(buffer, tmp)
    }
    //console.log(buffer)
    sendbytts(buffer)
}

function appendBuffer(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
    return tmp.buffer;
};

function makebullete(objs) {
    for (id in objs) {
        obj = objs[id];
        createBoxFF(obj)
    }
    function createBoxFF(objj) {
        var box_geometry = new THREE.SphereGeometry(objj.r, 8, 8)
        var box, material;
        material = Physijs.createMaterial( new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }),.95, .3  );
        box = new Physijs.SphereMesh(box_geometry, material);

        box.position.x = objj.pos.x;
        box.position.y = objj.pos.y;
        box.position.z = objj.pos.z;
        box.mass = objj.mas;
        box.notmine=true;
        //box.dealDamage = true;
        box.castShadow = true;
        box.uuid = objj.id
        setTimeout(removebullett.bind(null, box), objj.tim);
        function removebullett(box) {scene.remove(box); }

        scene.add(box);
        box.setLinearVelocity(new THREE.Vector3(objj.vel.x, objj.vel.y, objj.vel.z))
    };
}

function removeFromSceneById(id) {
    let obj = trackedObjects[id];
    if (obj == null) { console.log("null"); return }
    for (uuid in trackedObjects) {
        if (uuid == id) { console.log("vyicgbudhonij") }
    }
    try {
        scene.remove(obj.self)
    } catch (err) { console.log(err) }
}