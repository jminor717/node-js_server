/**
 * @author James Baicoianu / http://www.baicoianu.com/
 */

THREE.FlyControls = function ( object, domElement ) {

	var pitchObject = new THREE.Object3D();
	pitchObject.add( object.camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );
	var PI_2 = Math.PI / 2;

	this.object = object;
	var scope = this;
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
	
	var cardinals=[];
	
	cardinals.push(new THREE.Vector3(1,0,0));
	cardinals.push(new THREE.Vector3(-1,0,0));
	cardinals.push(new THREE.Vector3(0,1,0));
	cardinals.push(new THREE.Vector3(0,-1,0));
	cardinals.push(new THREE.Vector3(0,0,1));
	cardinals.push(new THREE.Vector3(0,0,-1));
	
	
	this.handleEvent = function ( event ) {
		if ( typeof this[ event.type ] == 'function' ) {
			this[ event.type ]( event );
		}
	};

	this.keydown = function( event ) {
		if ( event.altKey ) {
			return;
		}


		switch ( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = .1; break;


			case 87: /*W*/ foward =true ; break;
			case 83: /*S*/ back =true ; break;

			case 65: /*A*/ left=true; break;
			case 68: /*D*/ right=true; break;

			case 82: /*R*/ up = true; break;
			case 70: /*F*/down= true; break;
			
			
			case 37: /*up*/ this.moveState.pitchUp = 1; break;
			case 39: /*down*/ this.moveState.pitchDown = 1; break;

			case 38: /*left*/ this.moveState.yawLeft = 1; break;
			case 40: /*right*/ this.moveState.yawRight = 1; break;

			case 81: /*Q*/ this.moveState.rollLeft = 1; break;
			case 69: /*E*/ this.moveState.rollRight = 1; break;

		}

		this.updateMovementVector();
		this.updateRotationVector();

	};

	this.keyup = function( event ) {

		switch ( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = 1; break;


			case 87: /*W*/ foward =false ; break;
			case 83: /*S*/ back =false ; break;

			case 65: /*A*/ left=false; break;
			case 68: /*D*/ right=false; break;

			case 82: /*R*/ up = false; break;
			case 70: /*F*/down= false; break;

			
			case 37: /*up*/ this.moveState.pitchUp = 0; break;
			case 39: /*down*/ this.moveState.pitchDown = 0; break;

			case 38: /*left*/ this.moveState.yawLeft = 0; break;
			case 40: /*right*/ this.moveState.yawRight = 0; break;

			case 81: /*Q*/ this.moveState.rollLeft = 0; break;
			case 69: /*E*/ this.moveState.rollRight = 0; break;

		}

		this.updateMovementVector();
		this.updateRotationVector();

	};

	this.mousedown = function( event ) {
		if ( this.domElement !== document ) {
			this.domElement.focus();
		}
		event.preventDefault();
		event.stopPropagation();
		if ( this.dragToLook ) {
			this.mouseStatus ++;
		} else {
			switch ( event.button ) {
				case 0: this.moveState.forward = 1; break;
				case 2: this.moveState.back = 1; break;
			}
			this.updateMovementVector();
		}
	};

	this.mousemove = function( event ) {

		if ( scope.enabled === false ) return;
		var deltaX,deltaY;
		//check to make sure there is data to compare against
		if ((last_position.x) != 'undefined') {

			//get the change from last position to this position
			deltaX = last_position.x - event.clientX;
			deltaY = last_position.y - event.clientY;
			//console.log( deltaX,deltaY,last_position.x,last_position.y);
		}

		last_position.x=event.clientX;
		last_position.y=event.clientY;

		this.moveState.pitchDown =- deltaX*.05;
		this.moveState.yawLeft 	 = deltaY*.05;

		this.updateRotationVector();
		this.updateMovementVector();
		deltaX=0;
		deltaY=0;
	};

	this.mouseup = function( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.dragToLook ) {

			this.mouseStatus --;

			this.moveState.yawLeft = this.moveState.pitchDown = 0;

		} else {

			switch ( event.button ) {

				case 0: this.moveState.forward = 0; break;
				case 2: this.moveState.back = 0; break;

			}

			this.updateMovementVector();

		}

		this.updateRotationVector();

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
				//console.log(this.object);
				
				//m41.makeRotationFromQuaternion (this.object.quaternion);
				//dir.applyMatrix4 ( m41 );
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
				//console.log("ffff");
				var dist=craft.position.clone().sub(objects[i].position);
				var inside=dist.length();
				var totalr= craft.geometry.boundingSphere.radius+objects[i].geometry.boundingSphere.radius;
				inside-=totalr;
				if (inside<0){
					
					//console.log(dist);
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
		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.updateRotationVector = function() {
		//this.getDirection();
		this.rotationVector.x = ( - this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( - this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( - this.moveState.rollRight + this.moveState.rollLeft );
	};

	this.getContainerDimensions = function() {
		if ( this.domElement != document ) {
			return {
				size	: [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
				offset	: [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
			};
		} else {
			return {
				size	: [ window.innerWidth, window.innerHeight ],
				offset	: [ 0, 0 ]
			};
		}
	};

	function bind( scope, fn ) {
		return function () {
			fn.apply( scope, arguments );
		};
	}

	function contextmenu( event ) {
		event.preventDefault();
	}

	this.dispose = function() {

		this.domElement.removeEventListener( 'contextmenu', contextmenu, false );
		this.domElement.removeEventListener( 'mousedown', _mousedown, false );
		this.domElement.removeEventListener( 'mousemove', _mousemove, false );
		this.domElement.removeEventListener( 'mouseup', _mouseup, false );

		window.removeEventListener( 'keydown', _keydown, false );
		window.removeEventListener( 'keyup', _keyup, false );

	};

	var _mousemove = bind( this, this.mousemove );
	var _mousedown = bind( this, this.mousedown );
	var _mouseup = bind( this, this.mouseup );
	var _keydown = bind( this, this.keydown );
	var _keyup = bind( this, this.keyup );

	this.domElement.addEventListener( 'contextmenu', contextmenu, false );

	this.domElement.addEventListener( 'mousemove', _mousemove, false );
	this.domElement.addEventListener( 'mousedown', _mousedown, false );
	this.domElement.addEventListener( 'mouseup',   _mouseup, false );

	window.addEventListener( 'keydown', _keydown, false );
	window.addEventListener( 'keyup',   _keyup, false );

	this.updateMovementVector();
	this.updateRotationVector();

};
