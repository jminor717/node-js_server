class OffscreenStorage {
    constructor(spacing, divisor, plane, objectTyp, physics) {
        this.spacing = spacing;
        this.divisor = divisor;
        this.storagePlane = plane;
        this.objectType = objectTyp;
        this.physics = physics;
        this.modulus = 0b0;
        for (let i = 0; i < divisor; i++) {
            this.modulus = this.modulus | (0b1 << i);
        }
        this.currentIndex = 0;
        this.totalObjects = 0;
        this.instancedMesh;
        this.instanceID = 0;
        this.meshes = [];
    }
    offscreenPoint(index) {
        return new THREE.Vector3(
            2000 + ((index & this.modulus) * this.spacing),
            2000 + ((index >> this.divisor) * this.spacing),
            2000 + (this.storagePlane) * this.spacing);
    }
    storeMesh(mesh, id) {
        this.meshes.push(mesh);
        this.physics.moveMeshToStorage(mesh, this.offscreenPoint(this.currentIndex), this.currentIndex)
        this.totalObjects++;
        this.currentIndex++;
        this.instanceID = id;
    }
    getMeshAndSetPosition(position, velocity) {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.totalObjects - 1;
        }
        let mesh = meshes[currentIndex];
        this.physics.moveMeshFromStorage(mesh, position, velocity, this.currentIndex)
        return mesh;
    }
}