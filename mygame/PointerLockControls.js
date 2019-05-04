

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (object,domElement) {

	var scope = this;

	//object.camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( object.camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var PI_2 = Math.PI / 2;

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;
	if ( domElement ) this.domElement.setAttribute( 'tabindex', - 1 );

	// API
	this.movementSpeed = 50.0;
	this.rollSpeed = 0.001;
	this.dragToLook = false;
	this.autoForward = false;
	this.tmpQuaternion = new THREE.Quaternion();
	this.mouseStatus = 0;
	this.moveState = { up: 0.0, down: 0.0, left: 0.0, right: 0.0, forward: 0.0, back: 0.0, pitchUp: 0.0, pitchDown: 0.0, yawLeft: 0.0, yawRight: 0.0, rollLeft: 0.0, rollRight: 0.0 };
	this.moveVector = new THREE.Vector3( 0.0, 0.0, 0.0 );
	this.rotationVector = new THREE.Vector3( 0.0, 0.0, 0.0 );

	var last_position =new THREE.Vector2(0,0);
	var foward = false;
	var back = false;
	var right = false;
	var left = false;
	var up = false;
	var down = false;
	

	var onMouseMove = function ( event ) {
		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;

		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );
	};

	this.dispose = function() {
		document.removeEventListener( 'mousemove', onMouseMove, false );
	};

	document.addEventListener( 'mousemove', onMouseMove, false );
	this.enabled = false;

	this.getObject = function () {
		return yawObject;
	};

	this.getDirection = function() {
		var direction = new THREE.Vector3( 0, 0, - 1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );
		return function( v ) {
			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );
			v.copy( direction ).applyEuler( rotation );
			return v;
		};
	}();

	this.updateMovementVector = function() {
		var forward = ( this.moveState.forward || ( this.autoForward && ! this.moveState.back ) ) ? 1 : 0;
		this.moveVector.x = ( - this.moveState.left    + this.moveState.right );
		this.moveVector.y = ( - this.moveState.down    + this.moveState.up );
		this.moveVector.z = ( - forward + this.moveState.back );
	};

	this.updateRotationVector = function() {	
		this.getDirection();	
		this.rotationVector.x = ( - this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( - this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( - this.moveState.rollRight + this.moveState.rollLeft );
	};

	this.update = function( delta, craft, world , scene, camera ) {
		
		
		this.updateMovementVector();
		this.updateRotationVector();
		
		var moveMult = delta * this.movementSpeed;
		var rotMult = delta * this.rollSpeed;
		
		var tmpmove = new THREE.Vector3(0,0,0);
		var mrt = new THREE.Matrix4();
		
		if(foward)tmpmove.z=-0.5;
		if(back)tmpmove.z=0.5;
		
		if(right)tmpmove.y=0.1;
		if(left)tmpmove.y =-0.1;
		
		if(up)tmpmove.x=0.1;
		if(down)tmpmove.x =-0.1;

		var movestatevector = new THREE.Vector3( this.moveState.up, this.moveState.right, this.moveState.back );
		movestatevector.add(tmpmove);

		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
//		move.applyQuaternion(this.tmpQuaternion);
		this.moveVector.applyQuaternion(this.tmpQuaternion);
		movestatevector.applyQuaternion(this.tmpQuaternion);

		this.object.translateX( this.moveVector.x * moveMult );
		this.object.translateY( this.moveVector.y * moveMult );
		this.object.translateZ( this.moveVector.z * moveMult );
		
		
		
		var tmpove = new THREE.Vector3(this.moveVector.x * moveMult,this.moveVector.y * moveMult,this.moveVector.z * moveMult);
		//console.log(tmpove);
		craft.veloicity=tmpove;
		this.tmpQuaternion.set( this.rotationVector.y * rotMult, this.rotationVector.x * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		//camera.quaternion.multiply( this.tmpQuaternion );
		this.object.quaternion.multiply( this.tmpQuaternion );

		for (var j=0;j<cardinals.length;j++){					
			var direct= cardinals[j].clone().sub( craft.position.clone() );
			//console.log(craft);
			var raycaster = new THREE.Raycaster( craft.position.clone(), cardinals[j].clone().normalize(), 0, craft.geometry.boundingSphere.radius);

			var intersects = raycaster.intersectObject( world);
			//console.log(craft.geometry.boundingSphere.radius);
			
			if (intersects.length>0){
				var inside=craft.geometry.boundingSphere.radius-intersects[ 0 ].distance;
				var dir=intersects[ 0 ].face.normal.clone(); 
				
				var m41 = new THREE.Matrix4();
				var m42 = new THREE.Matrix4();
				m41.makeScale(1,-1,1);
				m42.makeRotationZ(Math.PI/2);
				dir.applyMatrix4 ( m41 );
				dir.applyMatrix4 ( m42 );

				this.tmpQuaternion.set( craft.quaternion.z, craft.quaternion.z, craft.quaternion.x, 1 ).normalize();
				
				//dir.applyQuaternion(craft.quaternion);
				dir.applyQuaternion(this.tmpQuaternion);
				console.log(this.tmpQuaternion);
				console.log(dir);
				
				var force= dir.clone().setLength(inside) ;
				force.multiplyScalar(this.movementSpeed*40);
				movestatevector.sub(force);
				movestatevector.divideScalar( 1.2);
			}
		}
		for(var i=0; i<objects.length;i++){
			objects[i].position.add(objects[i].velocity);
			try{
				var dist=craft.position.clone().sub(objects[i].position);
				var inside=dist.length();
				var totalr= craft.geometry.boundingSphere.radius+objects[i].geometry.boundingSphere.radius;
				inside-=totalr;
				if (inside<0){

					var force= dist.clone().setLength(inside);

					objects[i].velocity.add(force.divideScalar((objects[i].mass)));
					
					var m41 = new THREE.Matrix4();
					var m42 = new THREE.Matrix4();
					m41.makeScale(1,-1,1);
					m42.makeRotationZ(Math.PI/2);
					force.applyMatrix4 ( m41 );
					force.applyMatrix4 ( m42 );
					force.applyQuaternion(this.object.quaternion);
			 		movestatevector.sub(force.multiplyScalar(500/(craft.mass)));
				}
			}
			catch(e){
				
			}
		}

		this.moveState.up = movestatevector.x;
		this.moveState.right= movestatevector.y;
		this.moveState.back= movestatevector.z;

		this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );
	};
};
