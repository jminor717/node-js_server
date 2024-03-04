"use strict";

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import * as Nodes from 'three/nodes';

// import * as Objects from './CompressedObjects.js';
// import * as Network from './ApplicationLayer.js';
// import * as  physics from 'components/OimoPhysics.js';
// import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';

import { PointerLockControls, UserInputState } from '../NewGameNewLife/Controls.js';
import { RapierPhysics } from './RapierPhysics.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
import { CreateWall, createColoredWall } from './bodyBuilder.js'
import { PeerJsNetwork } from '..//NewGameNewLife/NetworkHelperClasses.js';
import { InstancedCube, Craft, ObjectDefinition, ObjectIdentifier, ProjectileCollection, SingleProjectile, objectTypes, GenerateObjectFromArray } from '../NewGameNewLife/CompressedObjects.js';

let craft, scene, renderer, stats, controls;
let physics;
let UserInputs = new UserInputState(1);
let network = new PeerJsNetwork();
network.WindowLog = (data) => { console.log(data); }

// airbag, projectile that expands (pushing other objects away, then shrinks back down and and re-expands multiple times as it moves)

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

    let craftPos = new THREE.Vector3(Math.random() * 7, Math.random() * 7, (Math.random() * 7) + 7)

    craft = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
    craft.position.set(craftPos.x, craftPos.y, craftPos.z);

    const craftGeometry = new THREE.IcosahedronGeometry(1, 2);//.toNonIndexed();
    const craftMaterial = new THREE.MeshLambertMaterial();
    const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
    craftMesh.position.set(craftPos.x, craftPos.y, craftPos.z);
    craftMesh.castShadow = true;
    craftMesh.visible = false;

    // scene.add(craftMesh);
    //physics.addMesh(craftMesh, 1);
    // craft = Object.assign(craft, craftProperties);
    craft.add(craftMesh);
    physics.addMesh(craft.children[0], 1, 0.3);
    scene.add(craft);
    // camera.position.y = 20;

    controls = new PointerLockControls(craft, document.body);
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
    createColoredWall(scale, { x: 0, y: -offset, z: 0 }, { x: - Math.PI / 2 }, scene)
    createColoredWall(scale, { x: 0, y: offset, z: 0 }, { x: Math.PI / 2 }, scene)
    createColoredWall(scale, { x: 0, y: 0, z: offset }, { y: - Math.PI }, scene)
    createColoredWall(scale, { x: 0, y: 0, z: -offset }, {}, scene)
    createColoredWall(scale, { x: offset, y: 0, z: 0 }, { y: -Math.PI / 2 }, scene)
    createColoredWall(scale, { x: -offset, y: 0, z: 0 }, { y: Math.PI / 2 }, scene)
    CreateWall({ x: scale, y: 1, z: scale }, { y: -offset }, scene, physics)
    CreateWall({ x: scale, y: 1, z: scale }, { y: offset }, scene, physics)
    CreateWall({ x: 1, y: scale, z: scale }, { x: -offset }, scene, physics)
    CreateWall({ x: 1, y: scale, z: scale }, { x: offset }, scene, physics)
    CreateWall({ x: scale, y: scale, z: 1 }, { z: -offset }, scene, physics)
    CreateWall({ x: scale, y: scale, z: 1 }, { z: offset }, scene, physics)

    const planeGeometry = new THREE.BoxGeometry(2, 2, 1);
    const sphereGeometry = new THREE.SphereGeometry(1);


    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true
    });

    const plane = new THREE.Mesh(planeGeometry, material);
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.z = - 1.5;

    physics.addMesh(sphere, 3, 0.3);
    plane.userData = { isWall: true }
    physics.addMesh(plane);

    scene.add(plane);
    scene.add(sphere);

    renderer = new WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    await renderer.compileAsync(scene, craft);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    // renderer = new THREE.WebGLRenderer({ antialias: true });
    // renderer.setPixelRatio(window.devicePixelRatio);
    // renderer.setSize(window.innerWidth, window.innerHeight);
    // renderer.shadowMap.enabled = true;
    // renderer.outputColorSpace = THREE.SRGBColorSpace;
    // document.body.appendChild(renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    animate();
}

function onDocumentMousedown(event) {
    // if (controls.isLocked === true) {
    //     if (event.button == 0) { single(1, 0.05, 300, 500) }
    //     if (event.button == 1) { grenade(1, 1, 50, 150) }
    //     if (event.button == 2) { shotgun(300, 0.3, 150, 200, 20) }
    // }
}

const myVelocity = new THREE.Vector3();
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

let craftProperties = {
    mass: 0.1,
    inertia: 1,
    gunPositions: [
        new THREE.Vector3(-0.55, -0.55, -1.5),
        new THREE.Vector3(0.55, -0.55, -1.5),
        new THREE.Vector3(0.55, 0.55, -1.5),
        new THREE.Vector3(-0.55, 0.556, -1.5)
    ],
    currentGunIndex: 0
}

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
        const group = new THREE.Group();

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
        craftMesh.userData = { mass: 1 }

        physics.addMesh(craftMesh, 1);
        scene.add(craftMesh);

        peer.isConnected = true;
        peer.mesh = craftMesh;
    }
}
network.OnPeerConnected = (id) => {
    console.log(id);
    Peers[id] = { isConnected: false }
}

init();

function animate() {
    // requestAnimationFrame(animate);
    renderer.render(scene, craft);
    stats.update();

    let tmpmove = new THREE.Vector3(0, 0, 0);

    if (controls.isLocked === true) {
        if (UserInputs.moveForward) tmpmove.z -= 1;
        if (UserInputs.moveBackward) tmpmove.z += 1;

        if (UserInputs.moveRight) tmpmove.x += 0.5;
        if (UserInputs.moveLeft) tmpmove.x -= 0.5;

        if (UserInputs.moveUp) tmpmove.y += 0.5;
        if (UserInputs.moveDown) tmpmove.y -= 0.5;
        if (UserInputs.activeDecelerate) {
            if (Math.abs(myVelocity.x) > 1) if (myVelocity.x < 0) tmpmove.x += .5; else tmpmove.x += -.5;
            if (Math.abs(myVelocity.y) > 1) if (myVelocity.y < 0) tmpmove.y += .5; else tmpmove.y += -.5;
            if (Math.abs(myVelocity.z) > 1) if (myVelocity.z < 0) tmpmove.z += 1; else tmpmove.z += -1;
        }

    }

    tmpmove.applyQuaternion(craft.quaternion);
    tmpmove.multiplyScalar(0.2);

    let physicsCraft = physics.getPhysicsBody(craft.children[0])
    physicsCraft.applyImpulse(tmpmove, true)
    let dat = { x: craft.quaternion.x, y: craft.quaternion.y, z: craft.quaternion.z, w: craft.quaternion.w};
    physicsCraft.setRotation(dat);
    // console.log(physicsCraft.rotation(), dat)


    if (UserInputs.AnyActiveDirectionalInputs() != true) {
        physicsCraft.setLinearDamping(1);
    } else {
        physicsCraft.setLinearDamping(0);
    }

    // console.log(craft.children[0].position)
    craft.position.set(craft.children[0].position.x, craft.children[0].position.y, craft.children[0].position.z);

    if (network.connTracker.numConnection() > 0) {
        network.Broadcast({
            myCraft: {
                pos: craft.children[0].position,
                vel: physicsCraft.linvel(),
                rot: dat,
            }
        });
    }


}