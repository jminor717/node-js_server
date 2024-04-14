"use strict";

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import * as Nodes from 'three/nodes';

// import * as Objects from './CompressedObjects.js';
// import * as Network from './ApplicationLayer.js';
// import * as  physics from 'components/OimoPhysics.js';
// import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';

import { PointerLockControls, UserInputState } from '../NewGameNewLife/Controls.js';
import { RapierPhysics } from './RapierPhysics.js';
// import { PidController } from './pid.js';
// import { VectorPidController } from './vectorPid.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import { CreateWall, createColoredWall, createCraft } from './bodyBuilder.js'
import { PeerJsNetwork } from '..//NewGameNewLife/NetworkHelperClasses.js';
import { InstancedCube, Craft, ObjectDefinition, ObjectIdentifier, ProjectileCollection, SingleProjectile, objectTypes, GenerateObjectFromArray } from '../NewGameNewLife/CompressedObjects.js';


let camera, scene, renderer, stats, controls;
let physics;
let UserInputs = new UserInputState(1);
let network = new PeerJsNetwork();
let craftMesh, craftView;
network.WindowLog = (data) => { console.log(data); }
let plane;

const CameraOffset = new THREE.Vector3(0, 0, 0);
const myVelocity = new THREE.Vector3();


let craftProperties = {
    mass: 0.1,
    inertia: 1,
    // gunPositions: [
    //     new THREE.Vector3(-0.55, -0.55, -1.5),
    //     new THREE.Vector3(0.55, -0.55, -1.5),
    //     new THREE.Vector3(0.55, 0.55, -1.5),
    //     new THREE.Vector3(-0.55, 0.55, -1.5)
    // ],
    gunPositions: [
        new THREE.Vector3(-0.75, -0.75, -1.5),
        new THREE.Vector3(0.75, -0.75, -1.5),
        new THREE.Vector3(0.75, 0.75, -1.5),
        new THREE.Vector3(-0.75, 0.75, -1.5)
    ],
    // gunPositions: [
    //     new THREE.Vector3(-1.55, -1.55, -1.5),
    //     new THREE.Vector3(1.55, -1.55, -1.5),
    //     new THREE.Vector3(1.55, 1.55, -1.5),
    //     new THREE.Vector3(-1.55, 1.556, -1.5)
    // ],
    currentGunIndex: 0
}

// airbag, projectile that expands (pushing other objects away, then shrinks back down and and re-expands multiple times as it moves)
// collider = world.createCollider;   collider.setRadius

/* 

upgrades:
    Seeing the code: adds a scanning function that shows all entities as wire frames with enemies highted red
        when in use you are also highted for all players 

    Tuner: allow PID values for rotational tracking to be tuned manually allowing more control over rotation
*/

let AuthorityLevels = [
    { auth: 0.15, dampening: 0.005 },
    { auth: 0.4, dampening: 0.1 },
    { auth: 0.6, dampening: 0.5 },
    { auth: 0.8, dampening: 1 },
]

const params = {
    export: Callie,
    controlAuthority: 0.2,
    sqrt: 0.005,
    levels: 0,
    lockTarget: false
};

function Callie() {
    params.controlAuthority = AuthorityLevels[params.levels].auth
    params.sqrt = AuthorityLevels[params.levels].dampening
    console.log("erfuiyb")
}
async function init() {
    network.start();
    physics = await RapierPhysics(new THREE.Vector3(0.0, 0.0, 0.0));

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x666666);

    const ambientLight = new THREE.AmbientLight(0xb0b0b0);

    const light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(0.32, 0.39, 0.7);

    scene.add(ambientLight);
    scene.add(light);

    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true
    });

    // let craftPos = new THREE.Vector3(Math.random() * 7, Math.random() * 7, (Math.random() * 7) + 7)
    let craftPos = new THREE.Vector3(0, 0, 7)

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
    camera.position.set(craftPos.x, craftPos.y, craftPos.z);
    let ret = createCraft(craftProperties, craftPos, true, scene, physics)
    craftMesh = ret.mesh;
    craftView = ret.view;

    scene.add(camera);

    controls = new PointerLockControls(camera, document.body);
    const blocker = document.getElementById('blocker');
    const instructions = document.getElementById('instructions');
    instructions.addEventListener('click', () => controls.lock());
    controls.addEventListener('lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });
    controls.addEventListener('unlock', function () {
        blocker.style.display = 'block';
        instructions.style.display = '';
    });
    document.addEventListener('keydown', (xvt) => UserInputs.onKeyDown(xvt));
    document.addEventListener('keyup', (xvt) => UserInputs.onKeyUp(xvt));
    document.addEventListener('mousedown', (xvt) => onDocumentMousedown(xvt), false);

    let scale = 50;
    let offset = (scale / 2) - 2;
    let phyDepth = 10;
    createColoredWall(scale, { x: 0, y: -offset, z: 0 }, { x: - Math.PI / 2 }, scene)
    createColoredWall(scale, { x: 0, y: offset, z: 0 }, { x: Math.PI / 2 }, scene)
    createColoredWall(scale, { x: 0, y: 0, z: offset }, { y: - Math.PI }, scene)
    createColoredWall(scale, { x: 0, y: 0, z: -offset }, {}, scene)
    createColoredWall(scale, { x: offset, y: 0, z: 0 }, { y: -Math.PI / 2 }, scene)
    createColoredWall(scale, { x: -offset, y: 0, z: 0 }, { y: Math.PI / 2 }, scene)
    CreateWall({ x: scale, y: phyDepth, z: scale }, { y: -offset - (phyDepth / 2) }, scene, physics)
    CreateWall({ x: scale, y: phyDepth, z: scale }, { y: offset + (phyDepth / 2) }, scene, physics)
    CreateWall({ x: phyDepth, y: scale, z: scale }, { x: -offset - (phyDepth / 2) }, scene, physics)
    CreateWall({ x: phyDepth, y: scale, z: scale }, { x: offset + (phyDepth / 2) }, scene, physics)
    CreateWall({ x: scale, y: scale, z: phyDepth }, { z: -offset - (phyDepth / 2) }, scene, physics)
    CreateWall({ x: scale, y: scale, z: phyDepth }, { z: offset + (phyDepth / 2) }, scene, physics)

    const planeGeometry = new THREE.BoxGeometry(2, 2, 2);
    const sphereGeometry = new THREE.SphereGeometry(1);

    plane = new THREE.Mesh(planeGeometry, material);
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.z = - 1.5;
    plane.position.x = 1.5;
    sphere.userData = { sphere: true }
    plane.userData = { plane: true }


    physics.addMesh(sphere, 3, 0.3);
    plane.userData = { isWall: true }
    physics.addMesh(plane);

    scene.add(plane);
    scene.add(sphere);

    renderer = new WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    await renderer.compileAsync(scene, camera);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = true;
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // document.body.appendChild(renderer.domElement);
    // renderer.setAnimationLoop(animate);

    const gui = new GUI();

    gui.add(params, 'export').name('Export DRC');
    gui.add(params, 'controlAuthority', 0, 1, 0.1);
    gui.add(params, 'sqrt', 0, 1, 0.01);
    gui.add(params, 'levels', 0, 3, 1);
    gui.add(params, 'lockTarget');

    stats = new Stats();
    document.body.appendChild(stats.dom);
}



function bullet() {

    let speed = 80;
    let mass = 100;

    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true
    });
    const sphereGeometry = new THREE.SphereGeometry(0.25);
    const sphere = new THREE.Mesh(sphereGeometry, material);

    let craftOffset = new THREE.Vector3(0, 0, -1.5)
    craftOffset.applyQuaternion(craftView.quaternion);
    craftOffset.add(craftView.position);

    let bulletVel = new THREE.Vector3(0, 0, -speed);
    bulletVel.applyQuaternion(craftView.quaternion);
    bulletVel.add(myVelocity);

    sphere.position.set(craftOffset.x, craftOffset.y, craftOffset.z)
    scene.add(sphere)
    physics.addMesh(sphere, mass);
    physics.setMeshVelocity(sphere, bulletVel)
}

function onDocumentMousedown(event) {
    if (controls.isLocked === true) {
        if (event.button == 0) { bullet(); }
        // if (event.button == 1) { grenade(1, 1, 50, 150) }
        // if (event.button == 2) { shotgun(300, 0.3, 150, 200, 20) }
    }
}

let Peers = {}

network.OnNetworkReady = () => {
    network.JoinNetwork().then(x => {
        console.log(x);
        if (Object.keys(x.Servers).includes("TestServer")) {
            network.JoinServer("TestServer");
        }
        else {
            network.CreateServer("TestServer");
        }
    })
};

network.OnData = (data, from) => {
    // console.log(data, from);
    let peer = Peers[from];
    if (peer.isConnected) {
        // peer.mesh.position.set(data.x, data.y, data.z);
        // console.log(data)
        let physicsCraft = physics.getPhysicsBody(peer.mesh)
        physicsCraft.setAngvel(new THREE.Vector3());
        // physicsCraft.setAngvel(data.myCraft.rot);
        physicsCraft.setLinvel(data.myCraft.vel);
        physicsCraft.setTranslation(data.myCraft.pos);
        physicsCraft.setRotation(data.myCraft.rot);


    } else {
        // let craftPos = new THREE.Vector3(data.x, data.y, data.z)
        const craftGeometry = new THREE.IcosahedronGeometry(1, 2);//.toNonIndexed();
        // const craftMaterial = new THREE.MeshLambertMaterial();
        const craftMaterial = new Nodes.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
        craftMaterial.colorNode = Nodes.normalLocal;

        const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
        craftProperties.gunPositions.forEach(gun => {
            const cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, gun.z, 12);
            // new THREE.BoxGeometry(0.5, 0.5, 0.5);
            // const meshMaterial = new THREE.MeshPhongMaterial({ color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
            const cylinder = new THREE.Mesh(cylinderGeometry, craftMaterial);
            cylinder.position.set(gun.x, gun.y, gun.z / 2);
            cylinder.rotateX(Math.PI / 2);
            cylinder.castShadow = true;
            cylinder.receiveShadow = true;
            craftMesh.add(cylinder);
        })
        let pos = data.myCraft.pos;
        craftMesh.position.set(pos.x, pos.y, pos.z);
        craftMesh.castShadow = true;

        physics.addMesh(craftMesh, 1, 1);
        scene.add(craftMesh);

        peer.isConnected = true;
        peer.mesh = craftMesh;
    }
}
network.OnPeerConnected = (id) => {
    console.log(id);
    Peers[id] = { isConnected: false }
}

network.OnPeerDisconnected = (id) =>{
    let peer = Peers[id];
    if (peer) {
        scene.remove(peer.mesh)
        physics.removeMesh(peer.mesh);
    }
};

init();

function animate() {
    let tmpmove = new THREE.Vector3(0, 0, 0);
    let userRotation = 0;
    let controlAuthority = params.controlAuthority;
    if (controls.isLocked === true) {
        if (UserInputs.moveForward) tmpmove.z -= 1;
        if (UserInputs.moveBackward) tmpmove.z += 1;

        if (UserInputs.moveRight) tmpmove.x += 0.5;
        if (UserInputs.moveLeft) tmpmove.x -= 0.5;

        if (UserInputs.moveUp) tmpmove.y += 0.5;
        if (UserInputs.moveDown) tmpmove.y -= 0.5;

        if (UserInputs.rollLeft) userRotation = 0.4;
        if (UserInputs.rollRight) userRotation = -0.4;
        // if (UserInputs.activeDecelerate) {
        //     if (Math.abs(myVelocity.x) > 1) if (myVelocity.x < 0) tmpmove.x += .5; else tmpmove.x += -.5;
        //     if (Math.abs(myVelocity.y) > 1) if (myVelocity.y < 0) tmpmove.y += .5; else tmpmove.y += -.5;
        //     if (Math.abs(myVelocity.z) > 1) if (myVelocity.z < 0) tmpmove.z += 1; else tmpmove.z += -1;
        // }
    }
    userRotation *= 0.25;
    camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), userRotation)

    if (params.lockTarget) {
        // todo this makes the camera pan choppy. why?
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    tmpmove.applyQuaternion(craftView.quaternion);
    tmpmove.multiplyScalar(controlAuthority);

    let physicsCraft = physics.getPhysicsBody(craftMesh)
    physicsCraft.applyImpulse(tmpmove, true)

    let mousePointing = new THREE.Vector3(0, 0, -(controlAuthority * 5));
    let craftPointing = new THREE.Vector3(0, 0, -(controlAuthority * 5));
    craftPointing.applyQuaternion(camera.quaternion)
    mousePointing.applyQuaternion(physicsCraft.rotation())

    let error = craftPointing.clone().sub(mousePointing)
    // craftView.arrowHelper.setDirection(error.clone().normalize());
    // craftView.arrowHelper.setLength(error.length());
    // apply 2 impulses on opposite sides of the craft in opposite directions so that there is only torque and no net force
    physicsCraft.applyImpulseAtPoint(error, craftPointing, true)
    physicsCraft.applyImpulseAtPoint(error.negate(), craftPointing.negate(), true)

    let fn = (x) => { return Math.max((-((x - 2) ^ 2)) + 4, 1); }
    let xx = Math.min(Math.max(fn(error.length()) * params.sqrt, 0.05), 2)
    physicsCraft.setAngularDamping(500 * xx);


    let mousePointing90 = new THREE.Vector3((controlAuthority * 5), 0, 0);
    let craftPointing90 = new THREE.Vector3((controlAuthority * 5), 0, 0);
    craftPointing90.applyQuaternion(camera.quaternion)
    mousePointing90.applyQuaternion(physicsCraft.rotation())
    physicsCraft.applyImpulseAtPoint(craftPointing90.clone().sub(mousePointing90), craftPointing90, true)
    physicsCraft.applyImpulseAtPoint(craftPointing90.clone().sub(mousePointing90).negate(), craftPointing90.clone().negate(), true)


    let craftVel = physicsCraft.linvel()
    myVelocity.set(craftVel.x, craftVel.y, craftVel.z)

    if (UserInputs.activeDecelerate || (myVelocity.length() < 1 && UserInputs.AnyActiveDirectionalInputs() != true)) {
        // if decelerate is active or speed is low while no inputs are active
        physicsCraft.setLinearDamping(2);
    } else {
        physicsCraft.setLinearDamping(0);
    }

    // console.log(craft.children[0].position)
    camera.position.set(craftMesh.position.x + CameraOffset.x, craftMesh.position.y + CameraOffset.y, craftMesh.position.z + CameraOffset.z);
    craftView.position.set(craftMesh.position.x, craftMesh.position.y, craftMesh.position.z);
    craftView.setRotationFromQuaternion(physicsCraft.rotation())

    // if (network.connTracker.numConnection() > 0) {
    if (Object.keys(Peers).length > 0) {
        let dat = { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w };
        network.Broadcast({
            myCraft: {
                pos: craftMesh.position,
                vel: physicsCraft.linvel(),
                rot: physicsCraft.rotation(),
            }
        });
    }
    renderer.render(scene, camera);
    stats.update();
    // requestAnimationFrame(animate);
}