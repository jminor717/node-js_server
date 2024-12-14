import { Clock, Vector3, Quaternion, Matrix4 } from 'three';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
// let RAPIER = null;

const RAPIER_PATH = 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';

const frameRate = 60;

const _scale = new Vector3(1, 1, 1);
const ZERO = new Vector3();


//let TrackedObjects = {};

function getCollider(geometry) {
	const parameters = geometry.parameters;

	// TODO change type to is*
	let collider = null;
	if (geometry.type === 'BoxGeometry') {
		const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
		const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
		const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

		collider = RAPIER.ColliderDesc.cuboid(sx, sy, sz);
	} else if (geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry') {
		const radius = parameters.radius !== undefined ? parameters.radius : 1;

		collider = RAPIER.ColliderDesc.ball(radius);
	} else if (geometry.type === 'CylinderGeometry') {
		const radius = Math.abs(parameters.radiusTop !== undefined ? parameters.radiusTop : 1);
		const halfHeigh = Math.abs(parameters.height !== undefined ? parameters.height / 2 : 0.5);
		// console.log(parameters, radius, halfHeigh)
		//Cylinder
		collider = RAPIER.ColliderDesc.cylinder(halfHeigh, radius);
	}
	//RAPIER.ActiveEvents.COLLISION_EVENTS         RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
	collider?.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);//| RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
	//console.log(RAPIER.ActiveEvents, RAPIER.ActiveHooks, collider)
	return collider;
}

async function RapierPhysics(gravity) {
	// const myPromise = new Promise((resolve, reject) => {
	// 	import('@dimforge/rapier3d').then(async _RAPIER => {
	// 		RAPIER = _RAPIER;
	// 		await RAPIER.init();
	// 		resolve("foo");
	// 	});
	// 	setTimeout(() => {
	// 		reject("import timed out");
	// 	}, 10000);
	// });
	// await myPromise;
	// Docs: https://rapier.rs/docs/api/javascript/JavaScript3D/	

	await RAPIER.init();
	//	const gravity = new Vector3( 0.0, - 0.01, 0.0 );
	const world = new RAPIER.World(gravity);

	const meshes = [];
	const meshMap = new WeakMap();
	const TrackedObjects = new Map();
	const _vector = new Vector3();
	const _quaternion = new Quaternion();
	const _matrix = new Matrix4();

	function addScene(scene) {
		scene.traverse(function (child) {
			if (child.isMesh) {
				const physics = child.userData;
				if (physics) {
					addMesh(child, physics.mass, physics.restitution);
				}
			}
		});
	}

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

				let params = RAPIER.JointData.fixed(
					{ x: childMesh.position.x, y: childMesh.position.y, z: childMesh.position.z },
					{ w: 1.0, x: 0.0, y: 0.0, z: 0.0 },
					{ x: 0, y: 0, z: 0 },
					{ w: childMesh.quaternion.w, x: childMesh.quaternion.x, y: childMesh.quaternion.y, z: childMesh.quaternion.z }
				);
				let joint = world.createImpulseJoint(params, body._body, body2._body, true);

				body._children.push(body2);
			});
		}

		if (density > 0) {
			meshes.push(mesh);
			meshMap.set(mesh, body);
		}
	}

	function removeMesh(mesh, index = 0){
		let body = getPhysicsBody(mesh, index);


		let ind = meshes.findIndex(x => x.uuid == mesh.uuid);
		console.log(mesh, body, ind)

		meshes.splice(ind, 1)
		meshMap.delete(mesh);

	}

	function AddBody(mesh, density, restitution, positionOffset = null) {
		const shape = getCollider(mesh.geometry);
		if (shape === null) return;

		shape.setDensity(density);
		shape.setRestitution(restitution);
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
			bodies.push(createBody(mesh, position, null, density, shape, positionOffset));
		}
		return bodies;
	}

	function createBody(mesh, position, quaternion, density, shape, positionOffset = null) {
		if (positionOffset) {
			position = new Vector3(positionOffset.x + position.x, positionOffset.y + position.y, positionOffset.z + position.z);
		}

		const desc = density > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
		desc.setTranslation(...position);
		if (quaternion !== null) desc.setRotation(quaternion);

		const body = world.createRigidBody(desc);
		TrackedObjects.set(body.handle, { Mesh: mesh, Body: body });
		let collider = world.createCollider(shape, body);

		return { _body: body, _collider: collider };
	}

	function setMeshPosition(mesh, position, index = 0) {
		let body = getPhysicsBody(mesh, index);
		body.setAngvel(ZERO);
		body.setLinvel(ZERO);
		body.setTranslation(position);
	}

	function setMeshVelocity(mesh, velocity, index = 0) {
		let body = getPhysicsBody(mesh, index);
		body.setLinvel(velocity);
	}

	function applyImpulse(mesh, velocity, index = 0) {
		let body = getPhysicsBody(mesh, index);
		body.applyImpulse(velocity, true);
	}

	function moveMeshToStorage(mesh, position, index = 0) {
		let body = getPhysicsBody(mesh, index);
		body.setAngvel(ZERO);
		body.setLinvel(ZERO);
		body.setTranslation(position);
		body.sleep();
	}


	function moveMeshFromStorage(mesh, position, velocity, index = 0) {
		let body = getPhysicsBody(mesh, index);
		body.wakeUp();
		body.setTranslation(position);
		body.setLinvel(velocity);
		body.setAngvel(ZERO);
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
		world.timestep = clock.getDelta();
		// world.step();

		let eventQueue = new RAPIER.EventQueue(true);
		world.step(eventQueue);

		eventQueue.drainCollisionEvents((handle1, handle2, started) => {
			/* Handle the collision event. */
			try {
				let obj1 = TrackedObjects.get(handle1), obj2 = TrackedObjects.get(handle2);
				let IsWall = obj1.Mesh.userData?.isWall || obj2.Mesh.userData?.isWall;
				if (IsWall) {
					// console.log(started, "with wall");
				} else {
					if (obj1.Mesh.userData?.IsChild) {
						// console.log(obj1.Mesh.userData.parent, obj2.Mesh.uuid)
					}
					// console.log(started, handle1, obj1.Mesh.userData, handle2, obj2.Mesh.userData, obj1, obj2);
					//childMesh.userData = { IsChild
				}
			} catch (error) {
				console.error(error);
			}

		});

		eventQueue.drainContactForceEvents(event => {
			let handle1 = event.collider1(); // Handle of the first collider involved in the event.
			let handle2 = event.collider2(); // Handle of the second collider involved in the event.
			// console.log(event, TrackedObjects.get(handle1), TrackedObjects.get(handle2));
			/* Handle the contact force event. */
		});

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

				mesh.position.copy(body._body.translation());
				mesh.quaternion.copy(body._body.rotation());
			}
		}
	}

	// animate

	setInterval(step, 1000 / frameRate);

	return {
		addScene: addScene,
		addMesh: addMesh,
		setMeshPosition: setMeshPosition,
		setMeshVelocity: setMeshVelocity,
		applyImpulse: applyImpulse,
		getPhysicsBody: getPhysicsBody,
		moveMeshToStorage: moveMeshToStorage,
		moveMeshFromStorage: moveMeshFromStorage,
		removeMesh: removeMesh,
	};

}

export { RapierPhysics };
