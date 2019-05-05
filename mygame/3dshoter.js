Physijs.scripts.worker = 'Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'Physijs/examples/js/ammo.js';
var camera, scene, renderer, controls;
//Physijs/Physijs/examples/js
var objects = [];
var bullets = [];
var craft, test, mouse;
//var arrowHelper
var raycaster;
var lasst;
var tmpQuaternion = new THREE.Quaternion();
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
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

init();
animate();

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
    scene.fog = new THREE.Fog(0xffffff, 0, 750);
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

function init() {
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
            scene.remove(this);
        }
    }
    createBoxtarget = function (health) {
        var box, material;
        material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), 0.6, 0.3);
        box = new Physijs.BoxMesh(box_geometry_target, material);
        box.health = health;
        box.startingHealth = health;
        box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
        box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
        box.position.z = Math.floor(Math.random() * 20 - 10) * 20;
        box.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        box.castShadow = true;
        box.addEventListener('collision', handleCollisiontarget);
        scene.add(box);
    }

    for (var i = 0; i < 100; i++) {
        createBoxtarget(100)
    }

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onDocumentmousedown, false);
    mouse = new THREE.Vector2();
    //arrowHelper = new THREE.ArrowHelper( new THREE.Vector3(0, 0, -10), craft.position, 20, 0xffff00 );
    //scene.add(arrowHelper);
    lasst = craft._physijs.linearVelocity.clone();
    doneinit();
}///////////innit   ************************************************************************************************************#################################

function createscene(objects) {
    objects.forEach(ele => {
        //console.log(ele)
        //scene.add(ele)
    })
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function dermineCloseobjects(craft, objects) {
    // console.log(craft)
    // console.log(objects)
    var close = [];
    objects.forEach(function (mesh) {
        //console.log(mesh.position);
        if (mesh.position.distanceTo(craft) < 50) {
            //console.log(mesh)
            close.push(mesh)
        }
    });
    return close;
}


function onDocumentmousedown(event) {
    //console.log(event.button,event.button,event.timeStamp)
    if (event.button == 0) { single(400000, 400, event) }
    if (event.button == 1) { grenade(250000, 50, event) }
    if (event.button == 2) { shotgun(100000, 200, 10, event) }
}


function grenade(total, speed, event) {
    event.preventDefault();
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(5, 8, 8),
        handleCollision = function (collided_with, linearVelocity, angularVelocity) {
            scene.remove(this);
            explosion(this.position, 100, this.mass);
            //scene.remove(this)   //console.log(collided_with)
        },
        createBox = function () {
            var box, material;
            material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
            box = new Physijs.SphereMesh(box_geometry, material);

            var ofset = diree.clone().normalize().multiplyScalar(10)
            box.position.x = craft.position.x + ofset.x;
            box.position.y = craft.position.y + ofset.y;
            box.position.z = craft.position.z + ofset.z;
            box.mass = total / speed;

            box.castShadow = true;
            box.dealDamage = true;
            box.addEventListener('collision', handleCollision);

            setTimeout(removebullett.bind(null, box), 3000);
            function removebullett(box) {
                if (box.parent === scene) {
                    var center = box.position;
                    scene.remove(box);
                    explosion(center, 100, box.mass * 3);
                }
            }

            vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
            var cvel = craft._physijs.linearVelocity.clone()
            //vel.applyMatrix4(mate)
            scene.add(box);
            //vel.applyEuler(craft.rotation)
            vel.add(cvel)
            box.setLinearVelocity(vel)
        };
    createBox()
}

function explosion(position, numobjects, totalmass) {
    //event.preventDefault();
    var mate = new THREE.Matrix4();
    //mate.makeRotationFromQuaternion(craft.quaternion);
    let boxes = []
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    createpellet = function () {
        var box, material;
        material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
        box = new Physijs.SphereMesh(box_geometry, material);

        var ofset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)//.applyMatrix4(mate)
        box.position.x = position.x + ofset.x;
        box.position.y = position.y + ofset.y;
        box.position.z = position.z + ofset.z;
        box.mass = totalmass / numobjects;

        box.castShadow = true;


        box.dealDamage = true;
        boxes.push(box)
        scene.add(box);
        vel = new THREE.Vector3((Math.random() * 800) - 400, (Math.random() * 800) - 400, (Math.random() * 800) - 400);
        //var cvel = craft._physijs.linearVelocity.clone()
        //vel.add(cvel.applyMatrix4(mate))
        //vel.applyMatrix4(mate)
        box.setLinearVelocity(vel)
    };
    createpellet()

    for (var i = 0; i < numobjects; i++) {
        createpellet()
    }
    setTimeout(removebullett.bind(null, boxes), 500);
    function removebullett(boxes) { boxes.forEach(box => { scene.remove(box); }) }
}

function shotgun(total, speed, pelets, event) {
    event.preventDefault();
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(.5, 8, 8)
    createpellet = function () {
        var box, material;
        material = Physijs.createMaterial(new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }), .95, .3);
        box = new Physijs.SphereMesh(box_geometry, material);

        var ofset = diree.clone().normalize().multiplyScalar(10).add(new THREE.Vector3((Math.random() * 2) - 1, (Math.random() * 2) - 1, (Math.random() * 2) - 1))
        box.position.x = craft.position.x + ofset.x;
        box.position.y = craft.position.y + ofset.y;
        box.position.z = craft.position.z + ofset.z;
        box.mass = total / speed;
        box.dealDamage = true;
        box.castShadow = true;

        setTimeout(removebullett.bind(null, box), 2000);
        function removebullett(box) { /*console.log(box);*/ scene.remove(box); }

        //vel = new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, -200);
        vel = diree.clone().normalize().multiplyScalar(speed).add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
        var cvel = craft._physijs.linearVelocity.clone()
        scene.add(box);
        vel.add(cvel)
        box.setLinearVelocity(vel)

    };
    //createpellet()

    for (var i = 0; i < pelets; i++) {
        createpellet();
    }
}

function getdirection() {
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2(0, 0);
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    return intersects[0].point.sub(craft.position)
}

function single(total, speed, event) {
    event.preventDefault();
    var diree = getdirection()
    var box_geometry = new THREE.SphereGeometry(2, 8, 8)
    createBox = function () {
        var box, material;
        material = Physijs.createMaterial(
            new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors }),
            .95, // medium friction
            .3 // low restitution
        );
        box = new Physijs.SphereMesh(box_geometry, material);

        var ofset = diree.clone().normalize().multiplyScalar(10)
        box.position.x = craft.position.x + ofset.x;
        box.position.y = craft.position.y + ofset.y;
        box.position.z = craft.position.z + ofset.z;
        box.mass = total / speed;
        box.dealDamage = true;
        box.castShadow = true;

        setTimeout(removebullett.bind(null, box), 2000);
        function removebullett(box) { /*console.log(box);*/ scene.remove(box); }

        vel = diree.clone().normalize().multiplyScalar(speed)//.add(new THREE.Vector3((Math.random() * 50) - 25, (Math.random() * 50) - 25, (Math.random() * 50) - 25))
        var cvel = craft._physijs.linearVelocity.clone()
        scene.add(box);
        vel.add(cvel)
        box.setLinearVelocity(vel)
    };
    createBox()
}

function animate() {
    requestAnimationFrame(animate);
    //console.log(arrowHelper)
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