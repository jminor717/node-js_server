import * as OIMO from 'three/addons/libs/OimoPhysics/index.js';

const frameRate = 60;
const meshes = [];
const meshMap = new WeakMap();
let lastTime = 0;
let world = null;

function getShape(geometry) {
	const parameters = geometry.parameters;
	// TODO change type to is* OCylinderGeometry
	if (geometry.type === 'BoxGeometry') {
		const sx = parameters.width !== undefined ? parameters.width / 2 : 0.5;
		const sy = parameters.height !== undefined ? parameters.height / 2 : 0.5;
		const sz = parameters.depth !== undefined ? parameters.depth / 2 : 0.5;

		return new OIMO.OBoxGeometry(new OIMO.Vec3(sx, sy, sz));
	} else if (geometry.type === 'SphereGeometry' || geometry.type === 'IcosahedronGeometry') {
		const radius = parameters.radius !== undefined ? parameters.radius : 1;
		return new OIMO.OSphereGeometry(radius);
	}
	else{
		console.log(geometry)
	}
	return null;
}



function addMesh(mesh, mass = 0, extraProperties = {}, collisionCallback = null) {
	const shape = getShape(mesh.geometry);
	if (shape !== null) {
		if (mesh.isInstancedMesh) {
			handleInstancedMesh(mesh, mass, shape, extraProperties, collisionCallback);
		} else if (mesh.isMesh) {
			handleMesh(mesh, mass, shape, extraProperties, collisionCallback);
		}
	}
}

function handleMesh(mesh, mass, shape, extraProperties, collisionCallback) {

	const shapeConfig = new OIMO.ShapeConfig();
	shapeConfig.geometry = shape;
	shapeConfig.density = mass;
	shapeConfig.contactCallback = collisionCallback; //setContactCallback(callback)

	const bodyConfig = new OIMO.RigidBodyConfig();
	bodyConfig.type = mass === 0 ? OIMO.RigidBodyType.STATIC : OIMO.RigidBodyType.DYNAMIC;
	bodyConfig.friction = 0;
	bodyConfig.position = new OIMO.Vec3(mesh.position.x, mesh.position.y, mesh.position.z);

	let body = new OIMO.RigidBody(bodyConfig);
	extraProperties.CustomProperties.index = 0;
	body = Object.assign(body, structuredClone(extraProperties));

	body.addShape(new OIMO.Shape(shapeConfig));
	world.addRigidBody(body);
	// console.log(body.getMassData())
	if (mass > 0) {
		meshes.push(mesh);
		meshMap.set(mesh, body);
	}
}

function handleInstancedMesh(mesh, mass, shape, extraProperties, collisionCallback) {
	const array = mesh.instanceMatrix.array;
	const bodies = [];

	for (let i = 0; i < mesh.count; i++) {
		const index = i * 16;

		const shapeConfig = new OIMO.ShapeConfig();
		shapeConfig.geometry = shape;
		shapeConfig.density = mass;
		shapeConfig.contactCallback = collisionCallback; //setContactCallback(callback)

		const bodyConfig = new OIMO.RigidBodyConfig();
		bodyConfig.type = mass === 0 ? OIMO.RigidBodyType.STATIC : OIMO.RigidBodyType.DYNAMIC;
		bodyConfig.position = new OIMO.Vec3(array[index + 12], array[index + 13], array[index + 14]);
		bodyConfig.friction = 0;

		let body = new OIMO.RigidBody(bodyConfig);
		extraProperties.CustomProperties.index = i;
		body = Object.assign(body, structuredClone(extraProperties));

		body.addShape(new OIMO.Shape(shapeConfig));
		world.addRigidBody(body);

		bodies.push(body);
		// console.log(body.getMassData())
	}

	if (mass > 0) {
		meshes.push(mesh);
		meshMap.set(mesh, bodies);
	}
}

function setMeshPosition(mesh, position, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		body.setLinearVelocity(new OIMO.Vec3(0, 0, 0));
		body.setPosition(new OIMO.Vec3(position.x, position.y, position.z));
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		body.setLinearVelocity(new OIMO.Vec3(0, 0, 0));
		body.setPosition(new OIMO.Vec3(position.x, position.y, position.z));
	}
}

function getMeshPosition(mesh, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		return body.getPosition();
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		return body.getPosition();
	}
}

function getMeshVelocity(mesh, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		return body.getLinearVelocity();
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		return body.getLinearVelocity();
	}
}

function setMeshVelocity(mesh, velocity, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		body.setLinearVelocity(new OIMO.Vec3(velocity.x, velocity.y, velocity.z));
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		body.setLinearVelocity(new OIMO.Vec3(velocity.x, velocity.y, velocity.z));
	}
}
function setMeshRotationVelocity(mesh, rotVel, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		body.setAngularVelocity(new OIMO.Vec3(rotVel.x, rotVel.y, rotVel.z));
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		body.setAngularVelocity(new OIMO.Vec3(rotVel.x, rotVel.y, rotVel.z));
	}
}


function setMeshRotation(mesh, rot, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		body.setOrientation(rot);
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		body.setOrientation(rot);
	}
}

function getMeshProperties(mesh, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		return { pos: body.getPosition(), vel: body.getLinearVelocity(), rot: body.getOrientation(), rotVel: body.getAngularVelocity() };
	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		return { pos: body.getPosition(), vel: body.getLinearVelocity(), rot: body.getOrientation(), rotVel: body.getAngularVelocity() };
	}
}

function setMeshProperties(mesh, object, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		body.setRotationXyz({ x: object.rot.x, y: object.rot.y, z: object.rot.z, w: object.rot.w });
		body.setPosition(new OIMO.Vec3(object.pos.x, object.pos.y, object.pos.z));
		body.setLinearVelocity(new OIMO.Vec3(object.vel.x, object.vel.y, object.vel.z));
		body.setAngularVelocity(new OIMO.Vec3(object.rotVel.x, object.rotVel.y, object.rotVel.z));

	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		body.setRotationXyz({ x: object.rot.x, y: object.rot.y, z: object.rot.z, w: object.rot.w });
		body.setPosition(new OIMO.Vec3(object.pos.x, object.pos.y, object.pos.z));
		body.setLinearVelocity(new OIMO.Vec3(object.vel.x, object.vel.y, object.vel.z));
		body.setAngularVelocity(new OIMO.Vec3(object.rotVel.x, object.rotVel.y, object.rotVel.z));
	}
}

function setMeshPropertiesWORotVel(mesh, object, index = 0) {
	if (mesh.isInstancedMesh) {
		const bodies = meshMap.get(mesh);
		const body = bodies[index];

		//body.setRotationXyz({ x: object.rot.x, y: object.rot.y, z: object.rot.z, w: object.rot.w });
		body.setPosition(new OIMO.Vec3(object.pos.x, object.pos.y, object.pos.z));
		body.setLinearVelocity(new OIMO.Vec3(object.vel.x, object.vel.y, object.vel.z));
		// body.setAngularVelocity(new OIMO.Vec3(object.rotVel.x, object.rotVel.y, object.rotVel.z));

	} else if (mesh.isMesh) {
		const body = meshMap.get(mesh);
		// body.setRotationXyz({ x: object.rot.x, y: object.rot.y, z: object.rot.z, w: object.rot.w });
		body.setPosition(new OIMO.Vec3(object.pos.x, object.pos.y, object.pos.z));
		body.setLinearVelocity(new OIMO.Vec3(object.vel.x, object.vel.y, object.vel.z));
		// body.setAngularVelocity(new OIMO.Vec3(object.rotVel.x, object.rotVel.y, object.rotVel.z));
	}
}

function step() {
	const time = performance.now();
	if (lastTime > 0) {
		// console.time( 'world.step' );
		world.step(1 / frameRate);
		// console.timeEnd( 'world.step' );
	}
	lastTime = time;

	for (let i = 0, l = meshes.length; i < l; i++) {
		const mesh = meshes[i];
		if (mesh.isInstancedMesh) {
			const array = mesh.instanceMatrix.array;
			const bodies = meshMap.get(mesh);

			for (let j = 0; j < bodies.length; j++) {
				const body = bodies[j];
				compose(body.getPosition(), body.getOrientation(), array, j * 16);
			}
			mesh.instanceMatrix.needsUpdate = true;
		} else if (mesh.isMesh) {
			const body = meshMap.get(mesh);

			mesh.position.copy(body.getPosition());
			mesh.quaternion.copy(body.getOrientation());
		}
	}
}


function compose(position, quaternion, array, index) {

	const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
	const x2 = x + x, y2 = y + y, z2 = z + z;
	const xx = x * x2, xy = x * y2, xz = x * z2;
	const yy = y * y2, yz = y * z2, zz = z * z2;
	const wx = w * x2, wy = w * y2, wz = w * z2;

	array[index + 0] = (1 - (yy + zz));
	array[index + 1] = (xy + wz);
	array[index + 2] = (xz - wy);
	array[index + 3] = 0;

	array[index + 4] = (xy - wz);
	array[index + 5] = (1 - (xx + zz));
	array[index + 6] = (yz + wx);
	array[index + 7] = 0;

	array[index + 8] = (xz + wy);
	array[index + 9] = (yz - wx);
	array[index + 10] = (1 - (xx + yy));
	array[index + 11] = 0;

	array[index + 12] = position.x;
	array[index + 13] = position.y;
	array[index + 14] = position.z;
	array[index + 15] = 1;

}

async function OimoPhysics(gravity) {
	// animate
	world = new OIMO.World(2, new OIMO.Vec3(0, gravity, 0));
	setInterval(step, 1000 / frameRate);

	return;
}



export {
	OimoPhysics,
	addMesh,
	setMeshPosition,
	getMeshPosition,
	getMeshVelocity,
	setMeshVelocity,
	setMeshRotation,
	setMeshRotationVelocity,
	getMeshProperties,
	setMeshProperties,
	setMeshPropertiesWORotVel
};
