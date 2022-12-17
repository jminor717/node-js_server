
"use strict";

import * as THREE from 'three';

import * as Objects from './CompressedObjects.js';
import * as Network from './ApplicationLayer.js';

import { PointerLockControls } from './Controls.js';
// import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as  physics from 'components/OimoPhysics.js';


class callback_ContactCallback {
    constructor(numUpdates) {
        this.updatesPerCollision = numUpdates;
    }
    beginContact(c) {
    }
    preSolve(c) {
    }
    postSolve(c) {
    }
    endContact(c) {
        const Id1 = c._b1?.CustomProperties, Id2 = c._b2?.CustomProperties;
        if (Id1 && Id2) {
            // if ((Id1.ObjectType == Objects.objectTypes.box && (Id2.ObjectType == Objects.objectTypes.bullet || Id2.ObjectType == Objects.objectTypes.grenade || Id2.ObjectType == Objects.objectTypes.shrapnel))
            //     || Id2.ObjectType == Objects.objectTypes.box && (Id1.ObjectType == Objects.objectTypes.bullet || Id1.ObjectType == Objects.objectTypes.grenade || Id1.ObjectType == Objects.objectTypes.shrapnel)) {
            const O1 = CollideAbleObjects[Id1.ID], O2 = CollideAbleObjects[Id2.ID];
            // console.log(Id1, Id2, O1, O2);
            // try {
            if (NetworkedObjects[Id1.ID])
                if (NetworkedObjects[Id1.ID][Id1.index]) {
                    NetworkedObjects[Id1.ID][Id1.index].hasCollided = true;
                    NetworkedObjects[Id1.ID][Id1.index].NeedsUpdated = this.updatesPerCollision;
                }
            // } catch (error) {
            //     console.log(Id1, NetworkedObjects[Id1.ID], error)
            //     return;
            // }
            // try {
            if (NetworkedObjects[Id2.ID])
                if (NetworkedObjects[Id2.ID][Id2.index]) {
                    NetworkedObjects[Id2.ID][Id2.index].hasCollided = true;
                    NetworkedObjects[Id2.ID][Id2.index].NeedsUpdated = this.updatesPerCollision;
                }
            // } catch (error) {
            //     console.log(Id2, NetworkedObjects[Id2.ID], error)
            //     return;
            // }



            if (O1?.instanceColor) {
                O1.instanceColor.needsUpdate = true;
                O1.setColorAt(Id1.index, color.setHex(0xff0000));
            }
            if (O2?.instanceColor) {
                O2.instanceColor.needsUpdate = true;
                O2.setColorAt(Id2.index, color.setHex(0xff0000));
            }
            if (Id2.ObjectType == Objects.objectTypes.grenade) {
                DetonateGrenade(Id2.index, bombStore)
            }
            if (Id1.ObjectType == Objects.objectTypes.grenade) {
                DetonateGrenade(Id1.index, bombStore)
            }

            // }

        }
        else {
            console.log(c._b1, c._b2)
        }

    }
}

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
            case 32: single(1, 0.05, 300, 500);
            case 71: explosion(controls.getObject().position, 1000, 900, 8);
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
    constructor(spacing, divisor, plane, objectTyp) {
        this.spacing = spacing;
        this.divisor = divisor;
        this.storagePlane = plane;
        this.objectType = objectTyp;
        this.modulus = 0b0;
        for (let i = 0; i < divisor; i++) {
            this.modulus = this.modulus | (0b1 << i);
        }
        this.currentIndex = 0;
        this.totalObjects = 0;
        this.SettlingTime = null;
        this.instancedMesh;
        this.instanceID = 0;
    }
    offscreenPoint(index) {
        return new THREE.Vector3(
            2000 + ((index & this.modulus) * this.spacing),
            2000 + ((index >> this.divisor) * this.spacing),
            2000 + (this.storagePlane) * this.spacing);
    }
    storeMesh(mesh, id) {
        this.instancedMesh = mesh;
        physics.setMeshPosition(mesh, this.offscreenPoint(this.currentIndex), this.currentIndex);
        this.totalObjects++;
        this.currentIndex++;
        this.instanceID = id;

        // if (this.SettlingTime != null) {
        //     clearTimeout(this.SettlingTime);
        // }
        // this.SettlingTime = setTimeout(() => this.settleQueue(), 1_000)
    }

    storeIndexedMesh(index) {
        if (this.instancedMesh) {
            let startingPosition = physics.getMeshPosition(this.instancedMesh, index);
            physics.setMeshPosition(this.instancedMesh, this.offscreenPoint(index), index);
            // this.currentIndex++;
            return startingPosition;
        }

        // if (this.SettlingTime != null) {
        //     clearTimeout(this.SettlingTime);
        // }
        // this.SettlingTime = setTimeout(() => this.settleQueue(), 1_000)
    }

    setLastMeshMeshPosAndVel(position, velocity) {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.totalObjects - 1;
        }
        physics.setMeshPosition(this.instancedMesh, position, this.currentIndex);
        physics.setMeshVelocity(this.instancedMesh, velocity, this.currentIndex);
    }

    settleQueue() {
        // console.log("simmer down")
        for (let i = 0; i < this.totalObjects; i++) {
            // physics.setMeshPosition(this.instancedMesh, this.offscreenPoint(i), this.currentIndex);
        }
        this.SettlingTime = null;
    }
}

let camera, scene, renderer, controls, stats;
let craftPos;
let ObjectId = new Objects.ObjectIdentifier();
const defaultBulletStore = new OffscreenStorage(20, 8, 1, Objects.objectTypes.bullet);
const shrapnelStore = new OffscreenStorage(20, 8, 2, Objects.objectTypes.shrapnel);
const bombStore = new OffscreenStorage(20, 8, 3, Objects.objectTypes.grenade);
const ProjectileStoresByDiameter = {
    0.5: shrapnelStore,
    2: defaultBulletStore,
    5: bombStore,
}
const ProjectileStoresByType = {};
ProjectileStoresByType[Objects.objectTypes.bullet] = defaultBulletStore;
ProjectileStoresByType[Objects.objectTypes.shrapnel] = shrapnelStore;
ProjectileStoresByType[Objects.objectTypes.grenade] = bombStore;


const GrenadeTimeouts = [];
let bulletsToSend = {};

const CollisionHandler = new callback_ContactCallback(Network.IsServer ? NupNetworkUpdatesPerCollision : 0);
const AimAbleObjects = [];
const CollideAbleObjects = {};

const NetworkedObjects = {};

const friction = 1;
const NupNetworkUpdatesPerCollision = 2;
const bulletMaterial = new THREE.MeshLambertMaterial();

let UserInputs = new UserInputState(1);

let prevTime = performance.now();
const myVelocity = new THREE.Vector3();
const impartedImpulse = new THREE.Vector3();

let craft = {};
let craftProperties = {
    mass: 0.1,
    inertia: 1,
    gunPositions: [
        new THREE.Vector3(-7, -7, -3),
        new THREE.Vector3(7, -7, -3),
        new THREE.Vector3(7, 7, -3),
        new THREE.Vector3(-7, 7, -3)
    ],
    currentGunIndex: 0
}


function removeMeshes(Meshes, BulletStore) {
    for (let key in Meshes) {
        BulletStore.storeIndexedMesh(Meshes[key]);
    }
}

function DetonateGrenade(index, BulletStore) {
    let timeOut = GrenadeTimeouts[index]?.index
    if (timeOut) {
        clearTimeout(timeOut)
        let pos = BulletStore.storeIndexedMesh(index)
        if (!GrenadeTimeouts[index].fromRemote) {
            explosion(pos, 300, 900, 5); //box.mass * 
        }
        delete GrenadeTimeouts[index];
    }
}

function makeBullets(ProjectileCollection, fromRemote = false) {
    // console.log(ProjectileCollection)
    if (!fromRemote) {
        Network.QueueObjectToSend({ 0: { 0: ProjectileCollection } })
    }

    let objectStore = ProjectileStoresByType[ProjectileCollection.ObjectType]
    let indices = [];
    ProjectileCollection.Projectiles.forEach(Projectile => {
        objectStore.setLastMeshMeshPosAndVel(Projectile.pos, Projectile.vel);
        indices.push(objectStore.currentIndex);
    });

    if (ProjectileCollection.ObjectType === Objects.objectTypes.grenade) {
        indices.forEach(index => {
            GrenadeTimeouts[index] = {};
            GrenadeTimeouts[index].index = setTimeout(DetonateGrenade.bind(null, index, objectStore), ProjectileCollection.Timeout);
            GrenadeTimeouts[index].fromRemote = fromRemote;
        });
    } else {
        setTimeout(removeMeshes.bind(null, indices, objectStore), ProjectileCollection.Timeout);
    }



}

function makeBullet(mass, inertia, speed, craftOffset, objectType, timeOut) {

    let CurCraftPos = controls.getObject().position;

    let vector = new THREE.Vector3(0, 0, -1).applyQuaternion(craft.quaternion);
    let cameraRaycaster = new THREE.Raycaster(CurCraftPos, vector, 0, 1000);

    const intersections = cameraRaycaster.intersectObjects(AimAbleObjects, false);

    craftOffset.applyQuaternion(craft.quaternion);
    craftOffset.add(CurCraftPos);
    // bulletMesh.position.copy(craftOffset);
    let bulletVel = new THREE.Vector3(0, 0, -speed);
    if (intersections.length > 0) {
        bulletVel = intersections[0].point.clone().sub(craftOffset.clone()).normalize().multiplyScalar(speed)
    }
    else {
        bulletVel.applyQuaternion(craft.quaternion);
    }
    bulletVel.add(myVelocity);

    makeBullets(new Objects.ProjectileCollection(1, objectType, [new Objects.SingleProjectile(craftOffset, bulletVel)], timeOut))

    impartedImpulse.add(bulletVel.multiplyScalar(inertia / craft.inertia));
}

function single(mass, inertia, speed, range) {
    let craftOffset = craft.gunPositions[craft.currentGunIndex].clone();
    craft.currentGunIndex++;
    craft.currentGunIndex = craft.currentGunIndex % craft.gunPositions.length;

    let time = (range / speed) * 1000
    makeBullet(mass, inertia, speed, craftOffset, Objects.objectTypes.bullet, time)
}

function grenade(mass, inertia, speed, range) {
    let time = (range / speed) * 1000;
    makeBullet(mass, inertia, speed, new THREE.Vector3(0, 0, -15), Objects.objectTypes.grenade, time)
}

function explosion(center, numObjects, totalMass, minRadius) {
    console.log("ekusplotion", center, numObjects, minRadius)
    let time = (150 / 300) * 1000
    // let shrapnelMeshes = []
    let shrapnelList = [];
    for (let i = 0; i < numObjects; i++) {
        let offset = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(minRadius + (Math.random() * 5))
        let position = new THREE.Vector3(center.x + offset.x, center.y + offset.y, center.z + offset.z)
        let shrapnelVelocity = position.clone().sub(center).normalize().multiplyScalar(400)
        shrapnelVelocity.add(myVelocity);

        shrapnelList.push(new Objects.SingleProjectile(position, shrapnelVelocity));
    }
    let thing = new Objects.ProjectileCollection(numObjects, Objects.objectTypes.shrapnel, shrapnelList, time);
    makeBullets(thing);
}

function shotgun(totalMass, inertia, speed, range, pellets) {
    const spread = 0.5;
    const halfSpread = spread / 2;

    let CurCraftPos = controls.getObject().position;
    let centerVelocity;
    let pelletsList = [];
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
        bulletVel.add(myVelocity).add(randSpread.clone().multiplyScalar(20));

        pelletsList.push(new Objects.SingleProjectile(craftOffset, bulletVel));
    }
    let time = (range / speed) * 1000
    let thing = new Objects.ProjectileCollection(pellets, Objects.objectTypes.shrapnel, pelletsList, time);
    makeBullets(thing)

    impartedImpulse.add(centerVelocity.multiplyScalar(inertia / craft.inertia));
}

function onDocumentMousedown(event) {
    if (controls.isLocked === true) {
        if (event.button == 0) { single(1, 0.05, 300, 500) }
        if (event.button == 1) { grenade(1, 1, 50, 150) }
        if (event.button == 2) { shotgun(300, 0.3, 150, 200, 20) }
    }
}



Network.WaitForConnection().then((dat) => {
    init(dat).then(() => { animate(); });
}).catch((err) => {
    console.log(err);
    init(null).then(() => { animate(); });
})

const color = new THREE.Color();


function createColoredWall(offset, rotation) {
    // floor
    const vertex = new THREE.Vector3();

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
    AimAbleObjects.push(floor);
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
    physics.addMesh(physicalFloor, 0, { CustomProperties: new Objects.ObjectIdentifier(Objects.objectTypes.wall) });
}

function CreateProjectiles(radius, numObjects, mass, PeerBoxes) {
    const geometry = new THREE.IcosahedronGeometry(radius, 1);

    let bullets = new THREE.InstancedMesh(geometry, bulletMaterial, numObjects);
    bullets.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
    bullets.castShadow = true;
    // bullets.receiveShadow = true;

    let UUID = getFirstUuidOfType(PeerBoxes, ProjectileStoresByDiameter[radius].objectType)

    ObjectId = new Objects.ObjectIdentifier(ProjectileStoresByDiameter[radius].objectType, UUID);
    CollideAbleObjects[ObjectId.ID] = bullets;
    if (radius > 3) {
        AimAbleObjects.push(bullets)
    }
    scene.add(bullets);
    physics.addMesh(bullets, mass, { CustomProperties: ObjectId }, CollisionHandler);

    for (let i = 0; i < bullets.count; i++) {
        ProjectileStoresByDiameter[radius].storeMesh(bullets, ObjectId.ID)
    }
}

function createOtherCraft(uuid, otherCraft) {
    const otherCraftGeometry = new THREE.IcosahedronGeometry(7, 2);//.toNonIndexed();
    const otherCraftMaterial = new THREE.MeshLambertMaterial();
    const otherCraftMesh = new THREE.Mesh(otherCraftGeometry, otherCraftMaterial);
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.x = 0;
    cylinder.position.y = 0;
    cylinder.position.z = -10;
    otherCraftMesh.add(cylinder);
    otherCraftMesh.castShadow = true;
    otherCraftMesh.receiveShadow = true;
    ObjectId = new Objects.ObjectIdentifier(Objects.objectTypes.craft, uuid)
    physics.addMesh(otherCraftMesh, craft.mass, { CustomProperties: ObjectId });
    scene.add(otherCraftMesh);
    physics.setMeshProperties(otherCraftMesh, otherCraft);
    CollideAbleObjects[uuid] = otherCraftMesh
}

function removeOtherCraft(uuid) {
    const otherCraftMesh = CollideAbleObjects[uuid];
    physics.setMeshPosition(otherCraftMesh,
        new THREE.Vector3(5000 + (Math.random() * 1000), 5000 + (Math.random() * 1000), 5000 + (Math.random() * 1000)));
    scene.remove(otherCraftMesh);
    // CollideAbleObjects[uuid] = otherCraftMesh
}

function getFirstUuidOfType(ListToSearch, objectType) {
    if (ListToSearch) {
        for (const key in ListToSearch) {
            const object = ListToSearch[key];
            if (object[0].ID.ObjectType == objectType) {
                return object[0].ID.ID;
            }
        }
    }
    return null;
}

async function init(PeerBoxes) {

    await physics.OimoPhysics(0);
    craftPos = new THREE.Vector3();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x666666);
    // scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0x666666, 0, 750);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.y = 20;

    const craftGeometry = new THREE.IcosahedronGeometry(7, 2);//.toNonIndexed();
    const craftMaterial = new THREE.MeshLambertMaterial();
    const craftMesh = new THREE.Mesh(craftGeometry, craftMaterial);
    craftMesh.position.y = 0;
    const cylinderGeometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 16);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.x = 0;
    cylinder.position.y = 0;
    cylinder.position.z = -10;
    craftMesh.add(cylinder);
    craftMesh.castShadow = true;
    // scene.add(craftMesh);
    //physics.addMesh(craftMesh, 1);
    craft = camera.clone();
    craft = Object.assign(craft, craftProperties);
    craft.add(craftMesh);

    // Object.assign(craft, craftMesh);
    // Object.assign(craft, camera);
    ObjectId = new Objects.ObjectIdentifier(Objects.objectTypes.craft, Network.MyClientID)
    physics.addMesh(craft.children[0], craft.mass, { CustomProperties: ObjectId });
    scene.add(craft);

    NetworkedObjects[ObjectId.ID] = {}
    NetworkedObjects[ObjectId.ID][0] = new Objects.Craft(physics.getMeshProperties(craft.children[0]), ObjectId)
    CollideAbleObjects[ObjectId.ID] = craft.children[0];

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const bulbGeometry = new THREE.IcosahedronGeometry(20, 3);//.toNonIndexed();
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
    physics.addMesh(bulbMesh, 0, { CustomProperties: new Objects.ObjectIdentifier(Objects.objectTypes.box) });
    AimAbleObjects.push(bulbMesh);

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

    CreateProjectiles(2, 500, 1, PeerBoxes);
    CreateProjectiles(5, 100, 1, PeerBoxes);
    CreateProjectiles(0.5, 3000, 15, PeerBoxes);

    // Boxes
    const geometryBox = new THREE.BoxGeometry(20, 20, 20);
    const material = new THREE.MeshLambertMaterial();
    const matrix = new THREE.Matrix4();

    let boxes = new THREE.InstancedMesh(geometryBox, material, 900);
    boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
    boxes.castShadow = true;
    boxes.receiveShadow = true;
    scene.add(boxes);
    AimAbleObjects.push(boxes);

    if (PeerBoxes) {
        for (const key in PeerBoxes) {
            const object = PeerBoxes[key];
            if (object.ObjectType == Objects.objectTypes.craft && !CollideAbleObjects[key]) {
                createOtherCraft(key, PeerBoxes[key][0])
            }
        }
    }

    let UUID = getFirstUuidOfType(PeerBoxes, Objects.objectTypes.box)

    let w = 30, w_2 = 15;
    for (let i = 0; i < boxes.count; i++) {
        if (PeerBoxes && UUID) {
            matrix.setPosition(PeerBoxes[UUID][i].pos.x, PeerBoxes[UUID][i].pos.y, PeerBoxes[UUID][i].pos.z);
            boxes.setMatrixAt(i, matrix);
            boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
        } else {
            matrix.setPosition(Math.floor(Math.random() * w - w_2) * w, Math.floor(Math.random() * w) * w + w_2, Math.floor(Math.random() * w - w_2) * w);
            boxes.setMatrixAt(i, matrix);
            boxes.setColorAt(i, color.setHex(0xffffff * Math.random()));
        }
    }

    ObjectId = new Objects.ObjectIdentifier(Objects.objectTypes.box, UUID);
    CollideAbleObjects[ObjectId.ID] = boxes;
    physics.addMesh(boxes, 0.1, { CustomProperties: ObjectId });

    NetworkedObjects[ObjectId.ID] = {}
    for (let i = 0; i < boxes.count; i++) {
        if (PeerBoxes) {
            physics.setMeshProperties(boxes, PeerBoxes[UUID][i], i)
        }
        ObjectId.index = i;
        NetworkedObjects[ObjectId.ID][ObjectId.index] = new Objects.InstancedCube(physics.getMeshProperties(boxes, i), ObjectId);
    }

    console.log(craft, NetworkedObjects)

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    stats = new Stats();
    document.body.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);

    // Network.QueueObjectToSend({ cmd: "sendState", data: NetworkedObjects });
    Network.SetFullStateObject(NetworkedObjects);

    setInterval(() => UpdateNetworkObjects(), 100)

    Network.SetUpdatePacketCallback(applyUpdatesFromNetwork)
    Network.NewPlayerCallback((newPeerObjects, PeerId) => {
        console.log("New Player",newPeerObjects)
        if (newPeerObjects[PeerId] && !CollideAbleObjects[PeerId]) {
            console.log(newPeerObjects[PeerId])
            createOtherCraft(PeerId, newPeerObjects[PeerId][0])
        }
    })
    Network.PlayerLeftCallback((PeerId) => {
        console.log(PeerId, CollideAbleObjects[PeerId])
        removeOtherCraft(PeerId)
    })
    Network.addServerChangedCallback(() => {
        CollisionHandler.updatesPerCollision = NupNetworkUpdatesPerCollision
    })
    //NewPlayerCallback, PlayerLeftCallback
}

function onWindowResize() {

    craft.aspect = window.innerWidth / window.innerHeight;
    craft.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function applyUpdatesFromNetwork(receivedObjects) {
    for (const key in receivedObjects) {
        const object = receivedObjects[key];
        for (const index in object) {
            const element = object[index];
            if (CollideAbleObjects[key]) {
                if ((element.ID.ObjectType & Objects.objectTypes.projectile) > 0) { //element.ID.ObjectType == Objects.objectTypes.craft ||
                    // physics.setMeshPropertiesWORotVel(CollideAbleObjects[key], element, index)
                } else {
                    physics.setMeshProperties(CollideAbleObjects[key], element, index)
                }
            }
            if (element.ID.ObjectType == Objects.objectTypes.projectileCollection) {
                makeBullets(element, true);
                // console.log(element, receivedObjects, CollideAbleObjects[key]);
            }
        }
    }
}

function UpdateNetworkObjects() {
    let updatedObjects = {};// bulletsToSend;
    for (const key in NetworkedObjects) {
        const object = NetworkedObjects[key];
        for (const index in object) {
            const element = object[index];
            let OutOfBandUpdate = Network.IsServer && element.hasCollided && element.PostCollisionUpdates && element.PostCollisionUpdates.includes(element.NeedsUpdated);
            if (element.NeedsUpdated > 0 || element.ID.ObjectType == Objects.objectTypes.craft || OutOfBandUpdate) {
                if (CollideAbleObjects[key]) {
                    let prop = physics.getMeshProperties(CollideAbleObjects[key], index)
                    if (element.ID.ObjectType == Objects.objectTypes.craft) {
                        prop.rot = craft.rotation;
                    }
                    element.Update(prop);
                } else {
                    console.log("NeedsUpdated", key)
                }
                if (updatedObjects[key] === null || updatedObjects[key] === undefined) {
                    updatedObjects[key] = {}
                    // updatedObjects[key].ObjectType = element.ID.ObjectType
                }
                updatedObjects[key][index] = element;
            }
            element.NeedsUpdated--;
        }
    }
    if (Object.keys(updatedObjects).length > 0) {
        Network.QueueObjectToSend(updatedObjects)
    }
    // bulletsToSend = {};
}

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    let internalVelocity = physics.getMeshVelocity(craft.children[0]);
    const simVelocity = new THREE.Vector3(internalVelocity.x, internalVelocity.y, internalVelocity.z);
    if (simVelocity.length() === 0) {
        simVelocity.set(myVelocity.x, myVelocity.y, myVelocity.z)
    }
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
    }
    tmpmove.add(simVelocity);
    myVelocity.set(tmpmove.x, tmpmove.y, tmpmove.z);
    myVelocity.sub(impartedImpulse);
    impartedImpulse.setLength(0);
    // console.log(simVelocity.length(), velocity.length() );

    const delta = (time - prevTime) / 1000;

    if (myVelocity.length() < 5 && UserInputs.AnyActiveDirectionalInputs() != true) {
        // console.log(UserInputs.AnyActiveDirectionalInputs())
        myVelocity.x -= myVelocity.x * friction * delta;
        myVelocity.y -= myVelocity.y * friction * delta;
        myVelocity.z -= myVelocity.z * friction * delta;
    }

    // controls.moveRight(- velocity.x * delta);
    // controls.moveForward(- velocity.z * delta);
    // console.log(3, controls.getObject());
    let camPosition = controls.getObject().position;

    camPosition.x += (myVelocity.x * delta);
    camPosition.y += (myVelocity.y * delta);
    camPosition.z += (myVelocity.z * delta);

    craftPos.set(camPosition.x, camPosition.y, camPosition.z);
    // physics.setMeshRotation(craft.children[0], craft.quaternion.clone().normalize());
    physics.setMeshPosition(craft.children[0], craftPos);
    physics.setMeshVelocity(craft.children[0], myVelocity);
    craft.children[0].position.x = craftPos.x / 250;
    craft.children[0].position.y = craftPos.y / 250;
    craft.children[0].position.z = craftPos.z / 250;

    prevTime = time;

    renderer.render(scene, craft);
    stats.update();
}