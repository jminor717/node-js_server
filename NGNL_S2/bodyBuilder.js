
"use strict";
import * as THREE from 'three';

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

export { CreateWall, createColoredWall }