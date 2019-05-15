/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (camera) {
    "use strict";
    console.log("camm")
    console.log(camera)
    var scope = this;

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);
    var rotMult = 0.001;
    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(camera);
    var tmpQuaternion = new THREE.Quaternion();
    var PI_2 = Math.PI / 2;
    var rollRight = 0, rollLeft = 0;
    var movementY = 0, movementX = 0;
    var onKeyDown = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true; break;
            case 37: // left
            case 65: // a
                moveLeft = true; break;
            case 40: // down
            case 83: // s
                moveBackward = true; break;
            case 39: // right
            case 68: // d
                moveRight = true; break;

            case 82: /*R*/ up = true; break;
            case 70: /*F*/down = true; break;

            case 81: /*Q*/ rollLeft = 1; break;
            case 69: /*E*/ rollRight = 1; break;

            case 88: stopnow = true;
            //	case 32: // space
            //		if ( canJump === true ) velocity.y += 350;
            //		canJump = false;
            //		break;
        }
    };
    var onKeyUp = function (event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false; break;
            case 37: // left
            case 65: // a
                moveLeft = false; break;
            case 40: // down
            case 83: // s
                moveBackward = false; break;
            case 39: // right
            case 68: // d
                moveRight = false; break;

            case 82: /*R*/ up = false; break;
            case 70: /*F*/down = false; break;

            case 81: /*Q*/ rollLeft = 0; break;
            case 69: /*E*/ rollRight = 0; break;
            case 88: stopnow = false;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    var onMouseMove = function (event) {
        if (scope.enabled === false) return;
        movementX += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        movementY += event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        tmpQuaternion = new THREE.Quaternion();
    };

    this.updateRotationVector = function () {
        tmpQuaternion = new THREE.Quaternion();
        tmpQuaternion.set(-movementY * rotMult, -movementX * rotMult, (rollLeft - rollRight) * rotMult * 30, 1).normalize();
        yawObject.quaternion.multiply(tmpQuaternion);
        movementY = 0; movementX = 0;
    };

    this.dispose = function () {
        document.removeEventListener('mousemove', onMouseMove, false);
    };

    document.addEventListener('mousemove', onMouseMove, false);
    this.enabled = false;

    this.getObject = function () {
        return yawObject;
    };
    this.getcamera = function () {
        return camera;
    }
    this.getquaternion = function () {
        return tmpQuaternion;
    }
};






