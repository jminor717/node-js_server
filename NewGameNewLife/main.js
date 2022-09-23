
"use strict";

import * as THREE from 'three';

import { PointerLockControls } from './Controls.js';
import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';
import Stats from 'three/addons/libs/stats.module.js';



class UserInputState {
    constructor(roleRate) {
        this.moveUp = false;
        this.moveDown = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.activeDecelerate = false;
        this.rollLeft = 0;
        this.rollRight = 0;
        this.defaultRollRate = roleRate;
    }
    onKeyDown(event) {
        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*w*/ this.moveForward = true; break;
            case 37: /*left*/
            case 65: /*a*/ this.moveLeft = true; break;
            case 40: /*down*/
            case 83: /*s*/ this.moveBackward = true; break;
            case 39: /*right*/
            case 68: /*d*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;

            case 81: /*Q*/ this.rollLeft = this.defaultRollRate; break;
            case 69: /*E*/ this.rollRight = this.defaultRollRate; break;

            case 88: /*X*/ this.activeDecelerate = true; break;
            case 32: single(300, 500); break;
            // case 32: // space
            //     if (canJump === true) velocity.y += 350;
            //     canJump = false;
            //     break;
        }
    };

    onKeyUp(event) {
        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*w*/ this.moveForward = false; break;
            case 37: /*left*/
            case 65: /*a*/ this.moveLeft = false; break;
            case 40: /*down*/
            case 83: /*s*/ this.moveBackward = false; break;
            case 39: /*right*/
            case 68: /*d*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

            case 81: /*Q*/ this.rollLeft = 0; break;
            case 69: /*E*/ this.rollRight = 0; break;

            case 88: /*X*/ this.activeDecelerate = false;
        }
    };

}

let camera, scene, renderer, controls, physics, stats;
let craftPos;
const OffscreenObjects = {
    DefaultBullets: [],
    SettlingTime: null
}

let boxes;
const osSpacing = 20, osDivisor = 8, osModulus = 0b1111_1111;
let offscreenIndex = 0;
const objects = [];

let raycaster;

const friction = 0.5;
const bulletMaterial = new THREE.MeshLambertMaterial();

let UserInputs = new UserInputState(1);

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

let craft = {};


function offscreenPoint(index) {
    return new THREE.Vector3(
        20 + ((index & osModulus) * osSpacing),
        20 + (((index >> osDivisor) & osModulus) * osSpacing),
        20 + ((index >> (osDivisor * 2)) * osSpacing),
    )
}

function removeMesh(mesh) {
    // scene.remove(mesh)
    physics.setMeshPosition(mesh, offscreenPoint(offscreenIndex));
    // mesh.position
    offscreenIndex++;
    OffscreenObjects.DefaultBullets.push(mesh);
}

function settleOffscreenQueue(){
    console.log("simmer down")
    for (let index = 0; index < OffscreenObjects.DefaultBullets.length; index++) {
        const element = OffscreenObjects.DefaultBullets[index];
        physics.setMeshPosition(element, offscreenPoint(index));
    }
}

function single(speed, range) {
    // "use strict";
    let time = (range / speed) * 1000
    let bulletMesh;
    if (OffscreenObjects.DefaultBullets.length > 0) {
        bulletMesh = OffscreenObjects.DefaultBullets.pop();
        offscreenIndex--;
    }
    else {
        const bulletGeometry = new THREE.IcosahedronGeometry(2, 1).toNonIndexed();
        bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    }

    let craftOffset = new THREE.Vector3(0, 0, -10);
    craftOffset.applyQuaternion(craft.quaternion);
    craftOffset.add(controls.getObject().position);
    bulletMesh.position.copy(craftOffset);
    let bulletVel = new THREE.Vector3(0, 0, -speed);
    bulletVel.applyQuaternion(craft.quaternion);
    bulletVel.add(velocity);

    scene.add(bulletMesh);
    physics.addMesh(bulletMesh, 0.1);
    physics.setVelocity(bulletMesh, bulletVel);
    setTimeout(removeMesh.bind(null, bulletMesh), time);
    if (OffscreenObjects.SettlingTime != null) {
        clearTimeout(OffscreenObjects.SettlingTime);
    }
    OffscreenObjects.SettlingTime = setTimeout(() => settleOffscreenQueue(), time + 1_000)

}

function grenade(speed, range){
    let time = (range / speed) * 1000
    function removeBullets(box) {
        if (box.parent === scene) {
            let center = box.position;
            scene.remove(box);
            console.log("ekusplotion", center)
            explosion(center, 300, 3);
        }
    }

    const bulletGeometry = new THREE.IcosahedronGeometry(5, 1).toNonIndexed();
    let bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    // let bbx = makeprojectile(position, vel, (total / speed), null, box_geometry, myBmaterial, 5, time)

    let craftOffset = new THREE.Vector3(0, 0, -10);
    craftOffset.applyQuaternion(craft.quaternion);
    craftOffset.add(controls.getObject().position);
    bulletMesh.position.copy(craftOffset);
    let bulletVel = new THREE.Vector3(0, 0, -speed);
    bulletVel.applyQuaternion(craft.quaternion);
    bulletVel.add(velocity);

    scene.add(bulletMesh);
    physics.addMesh(bulletMesh, 1);
    physics.setVelocity(bulletMesh, bulletVel);
    setTimeout(removeBullets.bind(null, bulletMesh), time);
}

function explosion(center, numObjects, totalMass) {
    let time = (150 / 300) * 1000
    let shrapnelMeshes = []
    let shrapnel = new THREE.IcosahedronGeometry(.5, 1)
    for (let i = 0; i < numObjects; i++) {
        let offset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
        let position = new THREE.Vector3(center.x + offset.x, center.y + offset.y, center.z + offset.z)
        console.log(position, center)
        let shrapnelVelocity = position.clone().sub(center).normalize().multiplyScalar(400)
        shrapnelVelocity.add(velocity);
        let shrapnelMesh = new THREE.Mesh(shrapnel, bulletMaterial);
        shrapnelMesh.position.copy(position);
        scene.add(shrapnelMesh);
        physics.addMesh(shrapnelMesh, totalMass / numObjects);
        physics.setVelocity(shrapnelMesh, shrapnelVelocity);
        shrapnelMeshes.push(shrapnelMesh)
    }
    setTimeout(removeShrapnel.bind(null, shrapnelMeshes), time);
    function removeShrapnel(shrapnelMeshes) { for (let key in shrapnelMeshes) { removeMesh(shrapnelMeshes[key]) /*scene.remove(boxes[key])*/ } }
}

function onDocumentMousedown(event) {
    if (event.button == 0) { single(300, 500) }
    if (event.button == 1) { grenade(50, 150) }
    // if (event.button == 2) { shotgun(400000, 200, 10, 350) }
}


init().then(() => { animate(); });

function handleCollision(){
    console.log("bleh");
}

async function init() {

    physics = await AmmoPhysics();
    craftPos = new THREE.Vector3();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x666666);
    // scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0x666666, 0, 750);
    physics.setGravity(0, 0, 0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 20;

    const craftGeometry = new THREE.IcosahedronGeometry(7, 3).toNonIndexed();
    const craftMaterial = new THREE.MeshLambertMaterial();
    const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
    craftMesh.position.y = 0;
    craftMesh.castShadow = true;
    // scene.add(craftMesh);
    //physics.addMesh(craftMesh, 1);
    craft = camera.clone();

    // camera.position
    // Object.assign(craft, craftMesh);
    // Object.assign(craft, camera);
    craft.add(craftMesh);
    physics.addMesh(craft.children[0], 1);
    scene.add(craft);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // const light = new THREE.DirectionalLight(0xffffff, 1);
    const d = 1000;
    const light = new THREE.PointLight(0xffffff, 1, d);
    light.position.set(0, 200, 0);
    light.castShadow = true;
    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -200;

    light.shadow.camera.near = 40;
    light.shadow.camera.far = 1000;

    light.shadow.mapSize.x = 1024;
    light.shadow.mapSize.y = 1024;

    scene.add(light);

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

    scene.add(controls.getObject());

    document.addEventListener('keydown', (xvt) => UserInputs.onKeyDown(xvt));
    document.addEventListener('keyup', (xvt) => UserInputs.onKeyUp(xvt));
    document.addEventListener('mousedown', (xvt) => onDocumentMousedown(xvt), false);

    raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

    // floor
    let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement
    let position = floorGeometry.attributes.position;
    for (let i = 0, l = position.count; i < l; i++) {
        vertex.fromBufferAttribute(position, i);
        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;
        position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices
    position = floorGeometry.attributes.position;
    const colorsFloor = [];

    for (let i = 0, l = position.count; i < l; i++) {
        color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
        colorsFloor.push(color.r, color.g, color.b);
    }

    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));
    const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);
    physics.addMesh(floor);

    const physicalFloor = new THREE.Mesh(
        new THREE.BoxGeometry(2000, 2000, 2000),
        new THREE.ShadowMaterial({ color: 0x111111 })
    );
    physicalFloor.position.y = - 998;
    physicalFloor.receiveShadow = true;
    scene.add(physicalFloor);
    physics.addMesh(physicalFloor);




    // Boxes
    const geometryBox = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshLambertMaterial();
    const matrix = new THREE.Matrix4();
    // position = geometryBox.attributes.position;
    // const BoxColors = [];

    // for (let i = 0, l = position.count; i < l; i++) {

    //     color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    //     BoxColors.push(color.r, color.g, color.b);

    // }

    // geometryBox.setAttribute('color', new THREE.Float32BufferAttribute(BoxColors, 3));

    boxes = new THREE.InstancedMesh(geometryBox, material, 300);
    boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
    boxes.castShadow = true;
    boxes.receiveShadow = true;
    boxes.addEventListener('collision', handleCollision);
    scene.add(boxes);
    objects.push(boxes);

    for (let i = 0; i < boxes.count; i++) {

        matrix.setPosition(Math.floor(Math.random() * 20 - 10) * 20, Math.floor(Math.random() * 20) * 20 + 10, Math.floor(Math.random() * 20 - 10) * 20);
        boxes.setMatrixAt(i, matrix);
        boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
        // boxes.setColorAt(i, color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75));
    }

    physics.addMesh(boxes, 1);

    // objects
    // const boxGeometry = new THREE.BoxGeometry(20, 20, 20).toNonIndexed();

    // position = boxGeometry.attributes.position;
    // const colorsBox = [];

    // for (let i = 0, l = position.count; i < l; i++) {

    //     color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
    //     colorsBox.push(color.r, color.g, color.b);

    // }

    // boxGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsBox, 3));

    // for (let i = 0; i < 500; i++) {
    //     const boxMaterial = new THREE.MeshPhongMaterial({ specular: 0xffffff, flatShading: true, vertexColors: true });
    //     boxMaterial.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

    //     const box = new THREE.Mesh(boxGeometry, boxMaterial);
    //     box.position.x = Math.floor(Math.random() * 20 - 10) * 20;
    //     box.position.y = Math.floor(Math.random() * 20) * 20 + 10;
    //     box.position.z = Math.floor(Math.random() * 20 - 10) * 20;

    //     scene.add(box);
    //     objects.push(box);

    // }
    console.log(craft)


    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {

    craft.aspect = window.innerWidth / window.innerHeight;
    craft.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    const time = performance.now();

    if (controls.isLocked === true) {

        let internalVelocity = physics.getVelocity(craft.children[0]);
        const simVelocity = new THREE.Vector3(internalVelocity.x(), internalVelocity.y(), internalVelocity.z());
        // console.log(1, simVelocity);
        let tmpmove = new THREE.Vector3(0, 0, 0);
        if (UserInputs.moveForward) tmpmove.z += 1;
        if (UserInputs.moveBackward) tmpmove.z -= 1;

        if (UserInputs.moveRight) tmpmove.x -= 0.5;
        if (UserInputs.moveLeft) tmpmove.x += 0.5;

        if (UserInputs.up) tmpmove.y -= 0.5;
        if (UserInputs.down) tmpmove.y += 0.5;


        tmpmove.applyQuaternion(craft.quaternion);
        velocity.x -= tmpmove.x - (simVelocity.x * 100);
        velocity.y -= tmpmove.y - (simVelocity.y * 100);
        velocity.z -= tmpmove.z - (simVelocity.z * 100);
        // console.log(2, simVelocity);

        raycaster.ray.origin.copy(controls.getObject().position);
        raycaster.ray.origin.y -= 10;

        const intersections = raycaster.intersectObjects(objects, false);

        const onObject = intersections.length > 0;

        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * friction * delta;
        velocity.y -= velocity.y * friction * delta;
        velocity.z -= velocity.z * friction * delta;

        //velocity.y -= 5 * 100.0 * delta; // 100.0 = mass

        direction.z = Number(UserInputs.moveForward) - Number(UserInputs.moveBackward);
        direction.x = Number(UserInputs.moveRight) - Number(UserInputs.moveLeft);
        direction.normalize(); // this ensures consistent movements in all directions


        //console.log(UserInputs);

        // if (UserInputs.moveForward || UserInputs.moveBackward) velocity.z -= direction.z * 800.0 * delta;
        // if (UserInputs.moveLeft || UserInputs.moveRight) velocity.x -= direction.x * 800.0 * delta;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
        }

        // controls.moveRight(- velocity.x * delta);
        // controls.moveForward(- velocity.z * delta);
        // console.log(3, controls.getObject());
        let camPosition = controls.getObject().position;

        camPosition.x += (velocity.x * delta);
        camPosition.y += (velocity.y * delta);
        camPosition.z += (velocity.z * delta);

        craftPos.set(camPosition.x, camPosition.y, camPosition.z);
        physics.setMeshPosition(craft.children[0], craftPos);
        craft.children[0].position.x = craftPos.x / 100;
        craft.children[0].position.y = craftPos.y / 100;
        craft.children[0].position.z = craftPos.z / 100;

        if (camPosition.y < 10) {
            velocity.y = 0;
            camPosition.y = 10;
        }

    }

    // if(time % 2 == 0 ){
    //     console.log(camPosition.x, camPosition.y, camPosition.z)
    // }

    prevTime = time;

    renderer.render(scene, craft);
    stats.update();

}