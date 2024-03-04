import { Clock, Vector3, Quaternion, Matrix4 } from 'three';

import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';
// let RAPIER = null;

const RAPIER_PATH = 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';

const frameRate = 60;

const _scale = new Vector3(1, 1, 1);
const ZERO = new Vector3();


let TrackedObjects = {};

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
	}
	//RAPIER.ActiveEvents.COLLISION_EVENTS         RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
	collider?.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);//| RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS
	console.log(RAPIER.ActiveEvents, RAPIER.ActiveHooks, collider)
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

	function addMesh(mesh, mass = 0, restitution = 0) {
		const shape = getCollider(mesh.geometry);
		if (shape === null) return;

		shape.setDensity(mass);
		shape.setRestitution(restitution);
		const body = mesh.isInstancedMesh
			? createInstancedBody(mesh, mass, shape)
			: createBody(mesh, mesh.position, mesh.quaternion, mass, shape);

		if (mass > 0) {
			meshes.push(mesh);
			meshMap.set(mesh, body);
		}
	}

	function createInstancedBody(mesh, mass, shape) {
		const array = mesh.instanceMatrix.array;
		const bodies = [];

		for (let i = 0; i < mesh.count; i++) {
			const position = _vector.fromArray(array, i * 16 + 12);
			bodies.push(createBody(mesh, position, null, mass, shape));
		}
		return bodies;
	}

	function createBody(mesh, position, quaternion, mass, shape) {
		const desc = mass > 0 ? RAPIER.RigidBodyDesc.dynamic() : RAPIER.RigidBodyDesc.fixed();
		desc.setTranslation(...position);
		if (quaternion !== null) desc.setRotation(quaternion);

		const body = world.createRigidBody(desc);
		TrackedObjects[body.handle] = { Mesh: mesh, Body: body };
		world.createCollider(shape, body);

		return body;
	}

	function setMeshPosition(mesh, position, index = 0) {
		let body = meshMap.get(mesh);
		if (mesh.isInstancedMesh) {
			body = body[index];
		}
		body.setAngvel(ZERO);
		body.setLinvel(ZERO);
		body.setTranslation(position);
	}

	function setMeshVelocity(mesh, velocity, index = 0) {
		let body = meshMap.get(mesh);
		if (mesh.isInstancedMesh) {
			body = body[index];
		}
		body.setLinvel(velocity);
	}

	function applyImpulse(mesh, velocity){
		let body = meshMap.get(mesh);
		if (mesh.isInstancedMesh) {
			body = body[index];
		}
		body.applyImpulse(velocity, true);
	}

	function getPhysicsBody(mesh){
		let body = meshMap.get(mesh);
		if (mesh.isInstancedMesh) {
			body = body[index];
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
				let IsWall = TrackedObjects[handle1].Mesh.userData?.isWall || TrackedObjects[handle2].Mesh.userData?.isWall;
				if (IsWall) {
					console.log(started, "with wall");
				} else {
					console.log(started, TrackedObjects[handle1].Mesh.userData, TrackedObjects[handle2].Mesh.userData, TrackedObjects[handle1], TrackedObjects[handle2]);
				}
			} catch (error) {
				console.error(error);
			}

		});

		eventQueue.drainContactForceEvents(event => {
			let handle1 = event.collider1(); // Handle of the first collider involved in the event.
			let handle2 = event.collider2(); // Handle of the second collider involved in the event.
			console.log(event, TrackedObjects[handle1], TrackedObjects[handle2]);
			/* Handle the contact force event. */
		});

		for (let i = 0, l = meshes.length; i < l; i++) {
			const mesh = meshes[i];
			if (mesh.isInstancedMesh) {
				const array = mesh.instanceMatrix.array;
				const bodies = meshMap.get(mesh);

				for (let j = 0; j < bodies.length; j++) {
					const body = bodies[j];

					const position = body.translation();
					_quaternion.copy(body.rotation());
					_matrix.compose(position, _quaternion, _scale).toArray(array, j * 16);
				}
				mesh.instanceMatrix.needsUpdate = true;
				mesh.computeBoundingSphere();
			} else {
				const body = meshMap.get(mesh);

				mesh.position.copy(body.translation());
				mesh.quaternion.copy(body.rotation());
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
		getPhysicsBody: getPhysicsBody
	};

}

export { RapierPhysics };
