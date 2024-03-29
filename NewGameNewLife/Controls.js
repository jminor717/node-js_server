import {
	Euler,
	EventDispatcher,
	Vector3
} from 'three';

const _euler = new Euler(0, 0, 0, 'YXZ');
const _vector = new Vector3();

const _changeEvent = { type: 'change' };
const _lockEvent = { type: 'lock' };
const _unlockEvent = { type: 'unlock' };

const _PI_2 = Math.PI / 2;

class PointerLockControls extends EventDispatcher {

	constructor(camera, domElement) {

		super();

		this.domElement = domElement;
		this.isLocked = false;

		// Set to constrain the pitch of the camera
		// Range is 0 to Math.PI radians
		this.minPolarAngle = 0; // radians
		this.maxPolarAngle = Math.PI; // radians

		this.pointerSpeed = 1.0;

		const scope = this;

		function onMouseMove(event) {
			if (scope.isLocked === false) return;
			const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
			const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

			_euler.setFromQuaternion(camera.quaternion);
			_euler.y -= movementX * 0.002 * scope.pointerSpeed;
			_euler.x -= movementY * 0.002 * scope.pointerSpeed;
			_euler.x = Math.max(_PI_2 - scope.maxPolarAngle, Math.min(_PI_2 - scope.minPolarAngle, _euler.x));

			camera.quaternion.setFromEuler(_euler);

			// scope.dispatchEvent(_changeEvent);
		}

		function onPointerlockChange() {
			if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
				scope.dispatchEvent(_lockEvent);
				scope.isLocked = true;
			} else {
				scope.dispatchEvent(_unlockEvent);
				scope.isLocked = false;
			}
		}

		function onPointerlockError() {
			console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
		}

		this.connect = function () {
			scope.domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError);
		};

		this.disconnect = function () {
			scope.domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
			scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange);
			scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError);
		};

		this.dispose = function () {
			this.disconnect();
		};

		this.getObject = function () { // retaining this method for backward compatibility
			return camera;
		};

		this.getDirection = function () {
			const direction = new Vector3(0, 0, - 1);
			return function (v) {
				return v.copy(direction).applyQuaternion(camera.quaternion);
			};
		}();

		this.moveForward = function (distance) {
			// move forward parallel to the xz-plane
			// assumes camera.up is y-up
			_vector.setFromMatrixColumn(camera.matrix, 0);
			_vector.crossVectors(camera.up, _vector);
			camera.position.addScaledVector(_vector, distance);
		};

		this.moveRight = function (distance) {
			_vector.setFromMatrixColumn(camera.matrix, 0);
			camera.position.addScaledVector(_vector, distance);
		};

		this.lock = function () {
			this.domElement.requestPointerLock();
		};

		this.unlock = function () {
			scope.domElement.ownerDocument.exitPointerLock();
		};

		this.connect();
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
			case 32: /*space*/ single(1, 0.05, 300, 500); 
			case 71: /*g*/ explosion(controls.getObject().position, 1000, 900, 8);
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

export { PointerLockControls, UserInputState };
