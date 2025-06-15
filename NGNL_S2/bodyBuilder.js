
"use strict";
import * as THREE from 'three';
import * as Nodes from 'three/nodes';

function createColoredWall(scale, offset, rotation, scene) {
    const vertex = new THREE.Vector3();
    const color = new THREE.Color();

    let floorGeometry = new THREE.PlaneGeometry(scale, scale, 60, 60);
    floorGeometry.rotateX(- Math.PI / 2);

    // vertex displacement
    let position = floorGeometry.attributes.position;
    for (let i = 0, l = position.count; i < l; i++) {
        vertex.fromBufferAttribute(position, i);
        vertex.x += Math.random() * (scale / 100) - (scale / 200);
        vertex.y += Math.random() * (scale / 1000);
        vertex.z += Math.random() * (scale / 100) - (scale / 200);
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
    // AimAbleObjects.push(floor);
}

function CreateWall(boxSize, offset, scene, physics) {
    const physicalFloor = new THREE.Mesh(
        new THREE.BoxGeometry(boxSize.x, boxSize.y, boxSize.z),
        new THREE.MeshLambertMaterial({ color: 0x999999, visible: false }) //{ color: 0x8f1111 }
    );
    if (offset.x)
        physicalFloor.position.x = offset.x;
    if (offset.y)
        physicalFloor.position.y = offset.y;
    if (offset.z)
        physicalFloor.position.z = offset.z;
    //physicalFloor.receiveShadow = true;
    physicalFloor.userData = { isWall: true };
    scene.add(physicalFloor);
    physics.addMesh(physicalFloor, 0, 0);
}

function createCraft(CraftProperties, position, IsSelf, scene, physics) {
    // const craftGeometry = new THREE.IcosahedronGeometry(1, 1);//.toNonIndexed();
    const craftGeometry = new THREE.SphereGeometry(1);//.toNonIndexed();
    // const craftMaterial = new THREE.MeshLambertMaterial();
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000, flatShading: true });
    const SeeThroughMaterial = new Nodes.MeshBasicNodeMaterial({ side: THREE.FrontSide });
    const craftMaterial = new Nodes.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    craftMaterial.colorNode = Nodes.normalLocal;


    let _craftMesh = new THREE.Mesh(craftGeometry, material);
    _craftMesh.position.set(position.x, position.y, position.z);
    _craftMesh.userData = { IsCraft: true }
    _craftMesh.visible = false;


    let _craftView = new THREE.Mesh(craftGeometry, IsSelf ? SeeThroughMaterial : craftMaterial);
    _craftView.castShadow = true;

    // craftView.setRotationFromQuaternion()

    CraftProperties.gunPositions.forEach(gun => {
        const cylinderGeometry = new THREE.CylinderGeometry(0.25, 0.25, gun.z, 12);
        // new THREE.BoxGeometry(0.5, 0.5, 0.5);
        // const meshMaterial = new THREE.MeshPhongMaterial({ color: 0x156289, emissive: 0x072534, side: THREE.DoubleSide, flatShading: true });
        const cylinder = new THREE.Mesh(cylinderGeometry, craftMaterial);
        cylinder.position.set(gun.x, gun.y, gun.z / 2);
        cylinder.rotateX(Math.PI / 2);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        cylinder.userData = { IsCraft: true, parent: _craftMesh.uuid }

        _craftMesh.add(cylinder);
        _craftView.add(cylinder.clone());
    })

    const sightGeometry = new THREE.RingGeometry(0.1, 0.105, 16);
    const sightGeometry2 = new THREE.RingGeometry(0.066, 0.071, 16);
    const sightGeometry3 = new THREE.RingGeometry(0.033, 0.038, 16);
    const sightGeometry4 = new THREE.SphereGeometry(0.005);
    const sightMaterial = new THREE.MeshBasicMaterial({ color: 0x3D413D, side: THREE.DoubleSide });
    const sightMesh = new THREE.Mesh(sightGeometry, sightMaterial);
    const sightMesh2 = new THREE.Mesh(sightGeometry2, sightMaterial);
    const sightMesh3 = new THREE.Mesh(sightGeometry3, sightMaterial);
    const sightMesh4 = new THREE.Mesh(sightGeometry4, sightMaterial);
    sightMesh.position.z = -1;
    sightMesh.add(sightMesh2)
    sightMesh.add(sightMesh3)
    sightMesh.add(sightMesh4)
    _craftView.add(sightMesh)

    const dir = new THREE.Vector3(1, 2, 0);
    dir.normalize();

    // const origin = new THREE.Vector3(0, 0, -1.5);
    // const length = 1;
    // const hex = 0xffff00;
    // arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
    // _craftView.add(arrowHelper);
    // _craftView.arrowHelper = arrowHelper;

    physics.addMesh(_craftMesh, 1, 0.3);
    scene.add(_craftView);

    return { mesh: _craftMesh, view: _craftView }
}


export { CreateWall, createColoredWall, createCraft }