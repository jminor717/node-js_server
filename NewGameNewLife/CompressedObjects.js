"use strict";
import * as THREE from 'three';


const CRAFT = 0;
const BOX = 1;
const WALL = 1 << 1;
const BULLET = 1 << 2;
const GRENADE = 1 << 3;
const SHRAPNEL = 1 << 4;
const PROJECTILE_COLLECTION = 1 << 5;

const objectTypes = Object.freeze({
    craft: CRAFT,
    box: BOX,
    wall: WALL,
    bullet: BULLET,
    grenade: GRENADE,
    shrapnel: SHRAPNEL,
    projectile: BULLET || GRENADE || SHRAPNEL,
    projectileCollection: PROJECTILE_COLLECTION,
});
class ObjectIdentifier {
    constructor(objectType, uuid = null, indx = 0) {
        if (uuid === null) {
            this.ID = Math.floor(Math.random() * Math.pow(2, 24))
        } else {
            this.ID = uuid;
        }
        this.ObjectType = objectType;
        this.index = indx;
    }

    cloneId() {
        return new ObjectIdentifier(this.ObjectType, this.ID, this.index)
    }
}

class ObjectDefinition {
    constructor(prop, id) {
        this.ID = id.cloneId();
        this.Update(prop);
        this.hasCollided = false;
        this.NeedsUpdated = 0;
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
        this.NeedsUpdated = -1;
        this.ArrayLength = Craft.ArrayLength;
    }

    ToArray() {
        return [objectTypes.craft, this.ID.ID, this.ID.index,
        this.pos.x, this.pos.y, this.pos.z,
        this.vel.x, this.vel.y, this.vel.z,
        this.rot.x, this.rot.y, this.rot.z,
        this.rotVel.x, this.rotVel.y, this.rotVel.z, this.rotVel.w]
    }

    static ArrayLength = 15;
    static FromArray(arr) {
        let uuid = new ObjectIdentifier(objectTypes.craft, arr[0])
        uuid.index = arr[1];
        let prop = {
            pos: { x: arr[2], y: arr[3], z: arr[4] },
            vel: { x: arr[5], y: arr[6], z: arr[7] },
            rot: { x: arr[8], y: arr[9], z: arr[10] },
            rotVel: { x: arr[11], y: arr[12], z: arr[13], w: arr[14] },
        }
        return new Craft(prop, uuid);
    }
}

class InstancedObject extends ObjectDefinition {
    constructor(prop, id) {
        super(prop, id)
        this.hasCollided = false;
        this.NeedsUpdated = 0;
    }
}

class InstancedCube extends InstancedObject {
    constructor(prop, id) {
        super(prop, id);
        this.ArrayLength = InstancedCube.ArrayLength;
        this.PostCollisionUpdates = [-10, -20, -30, -60, -120, -240];
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




// Objects\.(?!objectTypes)

class SingleProjectile{
    constructor(pos, vel){
        this.pos = pos;
        this.vel = vel;
    }
}

class ProjectileCollection {
    constructor(cnt, objectType, projectiles,timeout, arrLen = null) {
        // if ((objectType & objectTypes.projectile) > 0) {
        //     throw new Error(`invalid object type: ${objectType}`);
        // }
        // console.log(cnt, objectType, projectiles, timeout, arrLen)
        this.ObjectType = objectType;
        this.Projectiles = projectiles
        this.ProjectileCount = cnt;
        this.Timeout = timeout;
        this.ID = new ObjectIdentifier(objectTypes.projectileCollection, objectType, 0)
        this.ArrayLength = ProjectileCollection.BaseArrayLength + ProjectileCollection.LengthPerProjectile;
        if (arrLen) {
            this.ArrayLength = arrLen;
        }
    }

    static BaseArrayLength = 3;
    static LengthPerProjectile = 6;
    ToArray() {
        let data = [objectTypes.projectileCollection, this.ObjectType, this.ProjectileCount, this.Timeout]
        this.Projectiles.forEach(Projectile => {
            data = data.concat([
                Projectile.pos.x, Projectile.pos.y, Projectile.pos.z,
                Projectile.vel.x, Projectile.vel.y, Projectile.vel.z,
            ]);
        });
        return data;
    }

    static FromArray(arr) {
        // console.log(arr);
        let index = 2;
        let projectiles = [];
        while (index <= (arr[1] * ProjectileCollection.LengthPerProjectile) + 1) {
            projectiles.push(new SingleProjectile(
                { x: arr[++index], y: arr[++index], z: arr[++index] },
                { x: arr[++index], y: arr[++index], z: arr[++index] }
            ))
        }
        return new ProjectileCollection(arr[1], arr[0], projectiles, arr[2], index +1);
    }
}

let objectKeys = {};
objectKeys[objectTypes.craft] = Craft.FromArray;
objectKeys[objectTypes.box] = InstancedCube.FromArray;
objectKeys[objectTypes.projectileCollection] = ProjectileCollection.FromArray;

function GenerateObjectFromArray(buffer, offset) {
    var view = new Float32Array(buffer, offset, 1);
    var arr = new Float32Array(buffer, offset + 4);
    try {
        return objectKeys[view[0]](arr)
    } catch (error) {
        console.log(view[0], arr, error)
        return new Bullet({
            pos: { x: 0, y: 0, z: 0 },
            vel: { x: 0, y: 0, z: 0 },
            rot: { x: 0, y: 0, z: 0 },
            rotVel: { x: 0, y: 0, z: 0, w: 0 },
        }, new ObjectIdentifier(objectTypes.bullet))
    }
}

export { InstancedCube, Craft, ObjectDefinition, ObjectIdentifier, ProjectileCollection, SingleProjectile, objectTypes, GenerateObjectFromArray };