"use strict";

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';


// import * as Objects from './CompressedObjects.js';
// import * as Network from './ApplicationLayer.js';
// import * as  physics from 'components/OimoPhysics.js';
// import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';

import { PointerLockControls, UserInputState } from '../NewGameNewLife/Controls.js';
import { RapierPhysics } from './RapierPhysics.js';
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';

let craft, scene, renderer, stats, controls;
let physics;
let UserInputs = new UserInputState(1);

// airbag, projectile that expands (pushing other objects away, then shrinks back down and and re-expands multiple times as it moves)

init();

async function init() {
    physics = await RapierPhysics(new THREE.Vector3(0.0, 0.0, 0.0));


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x666666);

    const ambientLight = new THREE.AmbientLight(0xb0b0b0);

    const light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
    light.position.set(0.32, 0.39, 0.7);

    scene.add(ambientLight);
    scene.add(light);

    craft = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 1000);
    craft.position.z = 7;

    const craftGeometry = new THREE.IcosahedronGeometry(1, 2);//.toNonIndexed();
    const craftMaterial = new THREE.MeshLambertMaterial();
    const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
    craftMesh.position.z = 7;
    craftMesh.castShadow = true;
    
    // scene.add(craftMesh);
    //physics.addMesh(craftMesh, 1);
    // craft = Object.assign(craft, craftProperties);
    craftMesh.userData = {mass: 1}
    craft.add(craftMesh);
    physics.addMesh(craft.children[0], craftMesh.userData.mass);
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

    const planeGeometry = new THREE.BoxGeometry(2, 2, 1);
    const sphereGeometry = new THREE.SphereGeometry(1);


    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        flatShading: true
    });

    const plane = new THREE.Mesh(planeGeometry, material);
    const sphere = new THREE.Mesh(sphereGeometry, material);
    sphere.position.z = - 1.5;

    sphere.userData = { mass: 1, isWall: true }
    plane.userData = { mass: 0, isWall: true }
    physics.addMesh(sphere, sphere.userData.mass);
    physics.addMesh(plane, plane.userData.mass);

    scene.add(plane);
    scene.add(sphere);

    renderer = new WebGPURenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    await renderer.compileAsync(scene, craft);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

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
function animate() {
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

        tmpmove.applyQuaternion(craft.quaternion);
        tmpmove.multiplyScalar(0.2);
        
        let physicsCraft =physics.getPhysicsBody(craft.children[0])
        physicsCraft.applyImpulse(tmpmove, true)
        

        if (UserInputs.AnyActiveDirectionalInputs() != true) {
            physicsCraft.setLinearDamping(1);
        }else{
            physicsCraft.setLinearDamping(0);
        }

        console.log(craft.children[0].position)
        craft.position.set(craft.children[0].position.x, craft.children[0].position.y, craft.children[0].position.z);
        
    }
}