/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (camera) {
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

            case  88:stopnow=true;
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
            case  88:stopnow=false;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    var onMouseMove = function (event) {
        if (scope.enabled === false) return;
        movementX += event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        movementY += event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        tmpQuaternion = new THREE.Quaternion();
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

        //		move.applyQuaternion(this.tmpQuaternion);
        /*
                this.moveVector.applyQuaternion(tmpQuaternion);
                movestatevector.applyQuaternion(tmpQuaternion);
        
                this.object.translateX( this.moveVector.x * moveMult );
                this.object.translateY( this.moveVector.y * moveMult );
                this.object.translateZ( this.moveVector.z * moveMult );
        
                var tmpove = new THREE.Vector3(this.moveVector.x * moveMult,this.moveVector.y * moveMult,this.moveVector.z * moveMult);
                craft.veloicity=tmpove;
        
                tmpQuaternion.set( this.rotationVector.y * rotMult, this.rotationVector.x * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
                //camera.quaternion.multiply( this.tmpQuaternion );
                this.object.quaternion.multiply(tmpQuaternion );
        *///		tmpQuaternion.set(-movementY * rotMult, -movementX * rotMult, 0, 1 ).normalize();
        //console.log(yawObject)
        //		yawObject.quaternion.multiply(tmpQuaternion);
        //yawObject.rotation.y -= movementX * 0.002;
        //pitchObject.rotation.x -= movementY * 0.002;

    };

    this.updateRotationVector = function () {
        tmpQuaternion = new THREE.Quaternion();
        //rollRight,rollLeft
        //tmpQuaternion.set(1, 1,(0+rollRight-rollLeft) * rotMult, 1 ).normalize();
        //if ((rollRight-rollLeft)==0) return;
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
    this.getcamera=function(){
        return camera;
    }
    this.getquaternion = function () {
        return tmpQuaternion;
    }
    this.getDirection = function () {
        //*
        var direction = new THREE.Vector3(0, 0, - 1);
        var rotation = new THREE.Euler(0, 0, 0, "YXZ");
        return function (v) {
            console.log(yawObject)
            camera.quaternion=tmpQuaternion
            rotation.set(yawObject.rotation.x, yawObject.rotation.y, 0);
            v.copy(direction).applyEuler(rotation);
            return v;
        };

        //*/
    }();
};






