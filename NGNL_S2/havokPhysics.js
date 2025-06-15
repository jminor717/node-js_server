import { Clock, Vector3, Quaternion, Matrix4 } from 'three';

import "./havok.js";
// import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
// let RAPIER = null;

// const RAPIER_PATH = 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';

//https://doc.babylonjs.com/typedoc/classes/BABYLON.HavokPlugin#applyimpulse

const frameRate = 60;

const _scale = new Vector3(1, 1, 1);
const ZERO = new Vector3();
let havok, world;

//let TrackedObjects = {};

function getCollider(geometry) {
    const parameters = geometry.parameters;

    // TODO change type to is*
    let collider = null;
    if (geometry.type === 'BoxGeometry') {
        const sx = parameters.width !== undefined ? parameters.width : 0.5;
        const sy = parameters.height !== undefined ? parameters.height : 0.5;
        const sz = parameters.depth !== undefined ? parameters.depth : 0.5;

        collider = havok.HP_Shape_CreateBox(
            [0, 0, 0], [0, 0, 0, 1], [sx, sy, sz]
        )[1]

    } else if (geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry') {
        const radius = parameters.radius !== undefined ? parameters.radius : 1;

        collider = havok.HP_Shape_CreateSphere(
            [0, 0, 0], [radius]
        )[1]
    } else if (geometry.type === 'CylinderGeometry') {
        const radius = Math.abs(parameters.radiusTop !== undefined ? parameters.radiusTop : 1);
        const halfHeigh = Math.abs(parameters.height !== undefined ? parameters.height / 2 : 0.5);
        console.log(havok.HP_Shape_CreateCylinder)
        collider = havok.HP_Shape_CreateCylinder(
            [0, 0, 0], [0, 0, 0], [radius, halfHeigh]
        )[1]
        
        // console.log(parameters, radius, halfHeigh)
        //Cylinder
        // collider = RAPIER.ColliderDesc.cylinder(halfHeigh, radius);
    }
    //RAPIER.ActiveEvents.COLLISION_EVENTS         RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
    // collider?.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    //console.log(RAPIER.ActiveEvents, RAPIER.ActiveHooks, collider)
    return collider;
}

async function _HavocPhysics(gravity) {
    havok = await HavokPhysics();
    world = havok.HP_World_Create()[1];
    havok.HP_World_SetGravity(world, gravity);

    const meshes = [];
    const meshMap = new WeakMap();
    const TrackedObjects = new Map();
    const _vector = new Vector3();
    const _quaternion = new Quaternion();
    const _matrix = new Matrix4();


    function addMesh(mesh, density = 0, restitution = 0) {
        const body = AddBody(mesh, density, restitution);
        if (body === null) return;

        if (mesh.children.length > 0) {
            // console.log(mesh);
            body._children = []
            mesh.children.forEach(childMesh => {
                // console.log("Z")

                let positionOffset = new Vector3(mesh.position.x, mesh.position.y, mesh.position.z);
                const body2 = AddBody(childMesh, density, restitution, positionOffset);
                if (body2 === null) return;

                // let params = RAPIER.JointData.fixed(
                //     { x: childMesh.position.x, y: childMesh.position.y, z: childMesh.position.z },
                //     { w: 1.0, x: 0.0, y: 0.0, z: 0.0 },
                //     { x: 0, y: 0, z: 0 },
                //     { w: childMesh.quaternion.w, x: childMesh.quaternion.x, y: childMesh.quaternion.y, z: childMesh.quaternion.z }
                // );
                // let joint = world.createImpulseJoint(params, body._body, body2._body, true);

                body._children.push(body2);
            });
        }

        if (density > 0) {
            meshes.push(mesh);
            meshMap.set(mesh, body);
        }
    }

    function removeMesh(mesh, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);


        let ind = meshes.findIndex(x => x.uuid == mesh.uuid);
        console.log(mesh, body, ind)

        meshes.splice(ind, 1)
        meshMap.delete(mesh);

    }

    function AddBody(mesh, density, restitution, positionOffset = null) {
        const shape = getCollider(mesh.geometry);
        if (shape === null) return;

        const body = mesh.isInstancedMesh
            ? createInstancedBody(mesh, density, shape, positionOffset)
            : createBody(mesh, mesh.position, mesh.quaternion, density, shape, positionOffset);
        return body;
    }
    function createInstancedBody(mesh, density, shape, positionOffset = null) {
        const array = mesh.instanceMatrix.array;
        const bodies = [];

        for (let i = 0; i < mesh.count; i++) {
            const position = _vector.fromArray(array, i * 16 + 12);
            bodies.push(createBody(mesh, position, [0, 0, 0, 0], density, shape, positionOffset));
        }
        return bodies;
    }

    function createBody(mesh, position, quaternion, density, shape, positionOffset = null) {
        if (positionOffset) {
            position = new Vector3(positionOffset.x + position.x, positionOffset.y + position.y, positionOffset.z + position.z);
        }

        const Body = havok.HP_Body_Create()[1];
        // console.log(havok.HP_Body_GetMassProperties(Body)[1], havok.HP_Shape_GetDensity(shape)[1])

        // havok.HP_Shape_SetDensity(shape, density);
        havok.HP_Body_SetMassProperties(Body, [[0, 0, 0], density, [density, density, density], [0, 0, 0, 1]])
        // console.log(havok.HP_Body_GetMassProperties(Body)[1], havok.HP_Shape_GetDensity(shape)[1])

        havok.HP_Body_SetShape(Body, shape);
        // console.log(havok.HP_Body_GetMassProperties(Body)[1], havok.HP_Shape_GetDensity(shape)[1])

        havok.HP_Body_SetQTransform(Body, [[position.x, position.y, position.z], [quaternion.x, quaternion.y, quaternion.z, quaternion.w]])
        havok.HP_World_AddBody(world, Body, false);
        // console.log(havok.HP_Body_GetMassProperties(Body)[1], havok.HP_Shape_GetDensity(shape)[1])

        if (density > 0) {
            //DYNAMIC, KINEMATIC, STATIC
            // console.log(havok.MotionType["DYNAMIC"])
            havok.HP_Body_SetMotionType(Body, havok.MotionType["DYNAMIC"]);
        } else {
            havok.HP_Body_SetMotionType(Body, havok.MotionType["STATIC"]);
        }
        // shape.setRestitution(restitution);
        // TrackedObjects.set(body.handle, { Mesh: mesh, Body: body });

        return { _body: Body, _offset: havok.HP_Body_GetWorldTransformOffset(Body)[1] };
    }

    function setMeshPosition(mesh, position, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);
        // body.setAngvel(ZERO);
        // body.setLinvel(ZERO);
        // body.setTranslation(position);
    }

    function setMeshVelocity(mesh, velocity, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);
        havok.HP_Body_SetLinearVelocity(body, [velocity.x, velocity.y, velocity.z])
    }

    function applyImpulse(mesh, velocity, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);
        havok.HP_Body_ApplyImpulse(body, [velocity.x, velocity.y, velocity.z], [0,0,0])

        // body.applyImpulse(velocity, true);
    }

    function moveMeshToStorage(mesh, position, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);
        // body.setAngvel(ZERO);
        // body.setLinvel(ZERO);
        // body.setTranslation(position);
        // body.sleep();
    }


    function moveMeshFromStorage(mesh, position, velocity, index = 0, physicsBody = null) {
        let body = physicsBody ?? getPhysicsBody(mesh, index);
        // body.wakeUp();
        // body.setTranslation(position);
        // body.setLinvel(velocity);
        // body.setAngvel(ZERO);
    }

    function getPhysicsBody(mesh, index = 0) {
        let body = meshMap.get(mesh);
        if (mesh.isInstancedMesh) {
            body = body[index]._body;
        } else {
            body = body._body;
        }
        return body;
    }

    const clock = new Clock();

    function step() {
        // world.timestep = clock.getDelta();
        // world.step();

        const delta = clock.getDelta();
        havok.HP_World_Step(world, delta);
        // const barr = instancedBoxes.instanceMatrix.array;
        // for (let i = 0; i < instancedBoxes.bodies.length; i++) {
        //     const body = instancedBoxes.bodies[i];
        //     const transformBuffer = new Float32Array(havok.HEAPU8.buffer, bodyBuffer + body.offset, 16);
        //     const offset = 16 * i;
        //     for (let mi = 0; mi < 15; mi++) {
        //         if ((mi & 3) != 3) {
        //             barr[offset + mi] = transformBuffer[mi];
        //         }
        //     }
        //     barr[offset + 15] = 1.0;
        // }

        const bodyBuffer = havok.HP_World_GetBodyBuffer(world)[1];
        for (let i = 0, l = meshes.length; i < l; i++) {
            const mesh = meshes[i];
            if (mesh.isInstancedMesh) {
                const array = mesh.instanceMatrix.array;
                const bodies = meshMap.get(mesh);

                for (let j = 0; j < bodies.length; j++) {
                    const body = bodies[j]._body;

                    const position = body.translation();
                    _quaternion.copy(body.rotation());
                    _matrix.compose(position, _quaternion, _scale).toArray(array, j * 16);
                }
                mesh.instanceMatrix.needsUpdate = true;
                mesh.computeBoundingSphere();
            } else {
                const body = meshMap.get(mesh);
                // const transformBuffer = new Float32Array(havok.HEAPU8.buffer, bodyBuffer + body._offset, 16);
                // mesh.matrix.fromArray(transformBuffer);
                // for (let mi = 0; mi < 15; mi++) {
                //     if ((mi & 3) != 3) {
                //         mesh.matrix.elements[mi] = transformBuffer[mi];
                //     }
                // }
                // mesh.matrix.elements[15] = 1.0;
                // console.log(havok.HP_Body_GetPosition(body._body)[1], havok.HP_Body_GetOrientation(body._body)[1] )
                let pos = havok.HP_Body_GetPosition(body._body)[1]
                let rot = havok.HP_Body_GetOrientation(body._body)[1]
                mesh.position.copy(new Vector3(pos[0], pos[1], pos[2]));
                mesh.quaternion.copy(new Quaternion(rot[0], rot[1], rot[2], rot[3]));
            }
        }
    }

    // animate

    setInterval(step, 1000 / frameRate);

    return {
        addMesh: addMesh,
        setMeshPosition: setMeshPosition,
        setMeshVelocity: setMeshVelocity,
        applyImpulse: applyImpulse,
        getPhysicsBody: getPhysicsBody,
        moveMeshToStorage: moveMeshToStorage,
        moveMeshFromStorage: moveMeshFromStorage,
        removeMesh: removeMesh,
        havok: havok,
    };

}

export { _HavocPhysics };
