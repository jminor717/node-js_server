
import * as THREE from 'three';

const objectTypes = Object.freeze({
    craft: 0,
    box: 1,
    wall: 2,
    bullet: 3,
    grenade: 4,
    shrapnel: 5,
});

class ObjectIdentifier {
    constructor(objectType, uuid = null) {
        if (uuid === null) {
            this.ID = Math.floor(Math.random() * Math.pow(2, 24))
        } else {
            this.ID = uuid;
        }
        this.ObjectType = objectType;
        this.index = 0;
    }
}

class ObjectDefinition {
    constructor(prop, id) {
        this.ID = structuredClone(id);
        this.Update(prop);
        this.hasCollided = false;
        this.NeedsUpdated = false;
    }

    Update(prop) {
        this.pos = new THREE.Vector3(prop.pos.x, prop.pos.y, prop.pos.z);
        this.vel = new THREE.Vector3(prop.vel.x, prop.vel.y, prop.vel.z);
        this.rot = new THREE.Vector3(prop.rot.x, prop.rot.y, prop.rot.z);
        this.rotVel = new THREE.Quaternion(prop.rotVel.x, prop.rotVel.y, prop.rotVel.z, prop.rotVel.w);
    }
}

class Craft extends ObjectDefinition {
    constructor(prop, id) {
        super(prop, id);
        this.NeedsUpdated = true;
        this.ArrayLength = Craft.ArrayLength;
    }

    ToArray() {
        return [objectTypes.craft, this.ID.ID, this.ID.index,
        this.pos.x, this.pos.y, this.pos.z,
        this.vel.x, this.vel.y, this.vel.z,
        this.rot.x, this.rot.y, this.rot.z]
    }

    static ArrayLength = 11;
    static FromArray(arr) {
        let uuid = new ObjectIdentifier(objectTypes.craft, arr[0])
        uuid.index = arr[1];
        let prop = {
            pos: { x: arr[2], y: arr[3], z: arr[4] },
            vel: { x: arr[5], y: arr[6], z: arr[7] },
            rot: { x: arr[8], y: arr[9], z: arr[10] },
            rotVel: { x: 0, y: 0, z: 0, w: 0 },
        }
        return new Craft(prop, uuid);
    }
}

class InstancedObject extends ObjectDefinition {
    constructor(prop, id) {
        super(prop, id)
        this.hasCollided = false;
        this.NeedsUpdated = false;
    }

    // Update(prop) {
    //     super.Update(prop);
    // }
}

class InstancedCube extends InstancedObject {
    constructor(prop, id) {
        super(prop, id);
        this.ArrayLength = InstancedCube.ArrayLength;
    }
    ToArray() {
        return [objectTypes.box, this.ID.ID, this.ID.index,
        this.pos.x, this.pos.y, this.pos.z,
        this.vel.x, this.vel.y, this.vel.z,
        this.rot.x, this.rot.y, this.rot.z,
        this.rotVel.x, this.rotVel.y, this.rotVel.z, this.rotVel.w]
    }

    static ArrayLength = 15;
    static FromArray(arr) {
        let uuid = new ObjectIdentifier(objectTypes.box, arr[0])
        uuid.index = arr[1];
        let prop = {
            pos: { x: arr[2], y: arr[3], z: arr[4] },
            vel: { x: arr[5], y: arr[6], z: arr[7] },
            rot: { x: arr[8], y: arr[9], z: arr[10] },
            rotVel: { x: arr[11], y: arr[12], z: arr[13], w: arr[14] },
        }
        return new InstancedCube(prop, uuid);
    }
}


const objectKeys = {
    0: Craft.FromArray,
    1: InstancedCube.FromArray,
}

function GenerateObjectFromArray(buffer, offset) {
    var view = new Float32Array(buffer, offset, 1);
    var arr = new Float32Array(buffer, offset + 4);
    return objectKeys[view[0]](arr)
}

export { InstancedCube, Craft, InstancedObject, ObjectDefinition, ObjectIdentifier, objectTypes, GenerateObjectFromArray };