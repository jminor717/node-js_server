
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

    AnyActiveDirectionalInputs = () => this.moveForward || this.moveLeft || this.moveBackward || this.moveRight || this.moveUp || this.moveDown || this.rollLeft || this.rollRight;

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

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = true; break;
            // case 32: // space
            //     if (canJump === true) velocity.y += 350;
            //     canJump = false;
            //     break;
            case 32: single(0.1, 300, 500);
            default:
                break;
        }
    };

    onKeyUp(event) {
        this.ActiveDirectionalInputs--;
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

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = false; break;
            default:
                break;
        }
    };

}

class OffscreenStorage {
    constructor(spacing, divisor, plane) {
        this.spacing = spacing;
        this.divisor = divisor;
        this.storagePlane = plane;
        this.modulus = 0b0;
        for (let i = 0; i < divisor; i++) {
            this.modulus = this.modulus | (0b1 << i);
        }
        this.currentIndex = 0;
        this.meshes = [];
        this.SettlingTime = null;
    }
    offscreenPoint(index) {
        return new THREE.Vector3(
            20 + ((index & this.modulus) * this.spacing),
            20 + ((index >> this.divisor) * this.spacing),
            20 + (this.storagePlane) * this.spacing);
    }
    storeMesh(mesh) {
        // scene.remove(mesh)
        physics.setMeshPosition(mesh, this.offscreenPoint(this.currentIndex));
        this.currentIndex++;
        this.meshes.push(mesh);
        if (this.SettlingTime != null) {
            clearTimeout(this.SettlingTime);
        }
        this.SettlingTime = setTimeout(() => this.settleQueue(), 1_000)
    }

    getLastMeshMesh() {
        this.currentIndex--;
        return this.meshes.pop();
    }

    settleQueue() {
        // console.log("simmer down")
        for (let i = 0; i < this.meshes.length; i++) {
            const element = this.meshes[i];
            physics.setMeshPosition(element, this.offscreenPoint(i));
        }
        this.SettlingTime = null;
    }

}

let camera, scene, renderer, controls, physics, stats;
let craftPos;
const defaultBulletStore = new OffscreenStorage(20, 8, 1);
const shrapnelStore = new OffscreenStorage(20, 8, 2);
const bombStore = new OffscreenStorage(20, 8, 3);

const objects = [];

const friction = 1;
const bulletMaterial = new THREE.MeshLambertMaterial();

let UserInputs = new UserInputState(1);

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const impartedImpulse = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

let craft = {};
let craftProperties = {
    mass: 1,
    gunPositions: [
        new THREE.Vector3(-7, -7, -10),
        new THREE.Vector3(7, -7, -10),
        new THREE.Vector3(7, 7, -10),
        new THREE.Vector3(-7, 7, -10)
    ],
    currentGunIndex: 0
}


function removeMesh(mesh, BulletStore) {
    BulletStore.storeMesh(mesh);
}

function makeBullet(mass, speed, craftOffset, bulletMesh) {

    let CurCraftPos = controls.getObject().position;

    let vector = new THREE.Vector3(0, 0, -1).applyQuaternion(craft.quaternion);
    let cameraRaycaster = new THREE.Raycaster(CurCraftPos, vector, 0, 1000);

    const intersections = cameraRaycaster.intersectObjects(objects, false);

    craftOffset.applyQuaternion(craft.quaternion);
    craftOffset.add(CurCraftPos);
    bulletMesh.position.copy(craftOffset);
    let bulletVel = new THREE.Vector3(0, 0, -speed);
    if (intersections.length > 0) {
        bulletVel = intersections[0].point.clone().sub(craftOffset.clone()).normalize().multiplyScalar(speed)
    }
    else {
        bulletVel.applyQuaternion(craft.quaternion);
    }
    bulletVel.add(velocity);

    scene.add(bulletMesh);
    physics.addMesh(bulletMesh, mass);
    physics.setVelocity(bulletMesh, bulletVel);

    impartedImpulse.add(bulletVel.multiplyScalar(mass / (craft.mass * 10)));
}

function single(mass, speed, range) {
    let bulletMesh;
    if (defaultBulletStore.currentIndex > 0) {
        bulletMesh = defaultBulletStore.getLastMeshMesh()
    }
    else {
        const bulletGeometry = new THREE.IcosahedronGeometry(2, 1).toNonIndexed();
        bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    }

    let craftOffset = craft.gunPositions[craft.currentGunIndex].clone();
    craft.currentGunIndex++;
    craft.currentGunIndex = craft.currentGunIndex % craft.gunPositions.length;

    makeBullet(mass, speed, craftOffset, bulletMesh)

    let time = (range / speed) * 1000
    setTimeout(removeMesh.bind(null, bulletMesh, defaultBulletStore), time);
}

function grenade(mass, speed, range) {
    function removeBullets(box) {
        if (box.parent === scene) {
            bombStore.storeMesh(box)
            console.log("ekusplotion", box.position)
            explosion(box.position, 300, 3);
        }
    }

    const bulletGeometry = new THREE.IcosahedronGeometry(5, 1).toNonIndexed();
    let bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    makeBullet(mass, speed, new THREE.Vector3(0, 0, -10), bulletMesh)

    let time = (range / speed) * 1000
    setTimeout(removeBullets.bind(null, bulletMesh), time);
}

function explosion(center, numObjects, totalMass) {
    let time = (150 / 300) * 1000
    let shrapnelMeshes = []
    let shrapnel = new THREE.IcosahedronGeometry(0.5, 1)
    for (let i = 0; i < numObjects; i++) {
        let offset = new THREE.Vector3((Math.random() * 10) - 5, (Math.random() * 10) - 5, (Math.random() * 10) - 5)
        let position = new THREE.Vector3(center.x + offset.x, center.y + offset.y, center.z + offset.z)
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
    function removeShrapnel(shrapnelMeshes) { for (let key in shrapnelMeshes) { removeMesh(shrapnelMeshes[key], shrapnelStore) /*scene.remove(boxes[key])*/ } }
}

function shotgun(totalMass, speed, range, pellets) {
    const spread = 0.5;
    const halfSpread = spread/2;


    let CurCraftPos = controls.getObject().position;
    let centerVelocity;
    let pelletMeshes =[];

    for (let i = 0; i < pellets; i++) {
        let randSpread = new THREE.Vector3((Math.random() * spread) - halfSpread, (Math.random() * spread) - halfSpread, (Math.random() * spread) - halfSpread);
        randSpread.applyQuaternion(craft.quaternion)

        let craftOffset = new THREE.Vector3(0, 0, -10);
        craftOffset.applyQuaternion(craft.quaternion);
        craftOffset.add(CurCraftPos);
        craftOffset.add(randSpread)

        let bulletVel = new THREE.Vector3(0, 0, -speed);
        bulletVel.applyQuaternion(craft.quaternion);
        centerVelocity = bulletVel.clone()
        bulletVel.add(velocity).add(randSpread.clone().multiplyScalar(20));

        let bulletMesh;
        if (shrapnelStore.currentIndex > 0) {
            bulletMesh = shrapnelStore.getLastMeshMesh()
        }
        else {
            const bulletGeometry = new THREE.IcosahedronGeometry(0.5, 1).toNonIndexed();
            bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        }

        bulletMesh.position.copy(craftOffset);
        scene.add(bulletMesh);
        physics.addMesh(bulletMesh, totalMass / pellets);
        physics.setVelocity(bulletMesh, bulletVel);
        pelletMeshes.push(bulletMesh)
    }

    impartedImpulse.add(centerVelocity.multiplyScalar(totalMass / (craft.mass * 10)));

    let time = (range / speed) * 1000
    setTimeout(removePellets.bind(null, pelletMeshes), time);
    function removePellets(Meshes) { for (let key in Meshes) { removeMesh(Meshes[key], shrapnelStore) /*scene.remove(boxes[key])*/ } }
}

function onDocumentMousedown(event) {
    if (event.button == 0) { single(0.1, 300, 500) }
    if (event.button == 1) { grenade(1, 50, 150) }
    if (event.button == 2) { shotgun(1, 150, 200, 20) }
}


init().then(() => { animate(); });

function handleCollision() {
    console.log("bleh");
}

function createColoredWall(offset, rotation) {
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
    floorGeometry.rotateX(Math.PI / 2);

    if (rotation.x)
        floorGeometry.rotateX(rotation.x);
    if (rotation.y)
        floorGeometry.rotateY(rotation.y);
    if (rotation.z)
        floorGeometry.rotateZ(rotation.z);

    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));
    // const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const floorMaterial = new THREE.MeshLambertMaterial({ vertexColors: true });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.set(offset.x, offset.y, offset.z);
    floor.receiveShadow = true;
    scene.add(floor);
    // physics.addMesh(floor);
    objects.push(floor);
}

function CreateWall(boxSize, offset) {
    const physicalFloor = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z),
        new THREE.MeshLambertMaterial({ color: 0x8f1111 })
    );
    if (offset.x)
        physicalFloor.position.x = offset.x;
    if (offset.y)
        physicalFloor.position.y = offset.y;
    if (offset.z)
        physicalFloor.position.z = offset.z;
    //physicalFloor.receiveShadow = true;
    scene.add(physicalFloor);
    physics.addMesh(physicalFloor);
}

async function init() {

    physics = await AmmoPhysics(THREE);
    craftPos = new THREE.Vector3();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x666666);
    // scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0x666666, 0, 750);
    physics.setGravity(0, 0, 0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 20;

    const craftGeometry = new THREE.IcosahedronGeometry(7, 2).toNonIndexed();
    const craftMaterial = new THREE.MeshLambertMaterial();
    const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
    craftMesh.position.y = 0;
    craftMesh.castShadow = true;
    // scene.add(craftMesh);
    //physics.addMesh(craftMesh, 1);
    craft = camera.clone();
    craft = Object.assign(craft, craftProperties);

    // camera.position
    // Object.assign(craft, craftMesh);
    // Object.assign(craft, camera);
    craft.add(craftMesh);
    physics.addMesh(craft.children[0], craft.mass);
    scene.add(craft);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const bulbGeometry = new THREE.IcosahedronGeometry(20, 3).toNonIndexed();
    let bulbLight = new THREE.PointLight(0xffee88, 1, 1000);

    let bulbMat = new THREE.MeshStandardMaterial({
        emissive: 0xffffee,
        emissiveIntensity: 1,
        color: 0x000000
    });
    let bulbMesh = new THREE.Mesh(bulbGeometry, bulbMat)
    bulbMesh.position.set(0, 200, 0);
    bulbLight.position.set(0, 200, 0);
    bulbLight.add(bulbMesh);

    bulbLight.castShadow = true;
    scene.add(bulbLight);
    scene.add(bulbMesh);
    physics.addMesh(bulbMesh);
    objects.push(bulbMesh);

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

    // floor
    createColoredWall({ x: 0, y: 0, z: 0 }, { x: - Math.PI / 2 })
    createColoredWall({ x: 0, y: 999, z: 0 }, { x: Math.PI / 2 })
    createColoredWall({ x: 0, y: 0, z: 597 }, { y: - Math.PI })
    createColoredWall({ x: 0, y: 0, z: -597 }, {})
    createColoredWall({ x: 597, y: 0, z: 0 }, { y: -Math.PI / 2 })
    createColoredWall({ x: -597, y: 0, z: 0 }, { y: Math.PI / 2 })
    CreateWall({ x: 2000, y: 2, z: 2000 }, { y: -1 })
    CreateWall({ x: 2000, y: 2, z: 2000 }, { y: 1000 })
    CreateWall({ x: 2, y: 2000, z: 2000 }, { x: -598 })
    CreateWall({ x: 2, y: 2000, z: 2000 }, { x: 598 })
    CreateWall({ x: 2000, y: 2000, z: 2 }, { z: -598 })
    CreateWall({ x: 2000, y: 2000, z: 2 }, { z: 598 })

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

    let boxes = new THREE.InstancedMesh(geometryBox, material, 900);
    boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
    boxes.castShadow = true;
    boxes.receiveShadow = true;
    boxes.addEventListener('collision', handleCollision);
    scene.add(boxes);
    objects.push(boxes);
    let w = 30, w_2 = 15;

    for (let i = 0; i < boxes.count; i++) {

        matrix.setPosition(Math.floor(Math.random() * w - w_2) * w, Math.floor(Math.random() * w) * w + w_2, Math.floor(Math.random() * w - w_2) * w);
        boxes.setMatrixAt(i, matrix);
        boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
    }

    physics.addMesh(boxes, 3);


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

    let internalVelocity = physics.getVelocity(craft.children[0]);
    const simVelocity = new THREE.Vector3(internalVelocity.x(), internalVelocity.y(), internalVelocity.z());
    if (simVelocity.length() === 0) {
        simVelocity.set(velocity.x, velocity.y, velocity.z)
    }
    let tmpmove = new THREE.Vector3(0, 0, 0);

    if (controls.isLocked === true) {
        if (UserInputs.moveForward) tmpmove.z -= 1;
        if (UserInputs.moveBackward) tmpmove.z += 1;

        if (UserInputs.moveRight) tmpmove.x += 0.5;
        if (UserInputs.moveLeft) tmpmove.x -= 0.5;

        if (UserInputs.up) tmpmove.y += 0.5;
        if (UserInputs.down) tmpmove.y -= 0.5;
        if (UserInputs.activeDecelerate) {
            if (Math.abs(velocity.x) > 1) if (velocity.x < 0) tmpmove.x += .5; else tmpmove.x += -.5;
            if (Math.abs(velocity.y) > 1) if (velocity.y < 0) tmpmove.y += .5; else tmpmove.y += -.5;
            if (Math.abs(velocity.z) > 1) if (velocity.z < 0) tmpmove.z += 1; else tmpmove.z += -1;
        }

        tmpmove.applyQuaternion(craft.quaternion);
    }
    tmpmove.add(simVelocity);
    velocity.set(tmpmove.x, tmpmove.y, tmpmove.z);
    velocity.sub(impartedImpulse);
    impartedImpulse.setLength(0);
    // console.log(simVelocity.length(), velocity.length() );

    const delta = (time - prevTime) / 1000;

    if (velocity.length() < 5 && UserInputs.AnyActiveDirectionalInputs() != true) {
        // console.log(UserInputs.AnyActiveDirectionalInputs())
        velocity.x -= velocity.x * friction * delta;
        velocity.y -= velocity.y * friction * delta;
        velocity.z -= velocity.z * friction * delta;
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
    physics.setVelocity(craft.children[0], velocity);
    craft.children[0].position.x = craftPos.x / 200;
    craft.children[0].position.y = craftPos.y / 200;
    craft.children[0].position.z = craftPos.z / 200;



    // if(time % 2 == 0 ){
    //     console.log(camPosition.x, camPosition.y, camPosition.z)
    // }

    prevTime = time;

    renderer.render(scene, craft);
    stats.update();

}