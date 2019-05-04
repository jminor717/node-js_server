/**
 * @author James Baicoianu / http://www.baicoianu.com/
 */

THREE.FlyControls = function ( object, domElement ) {

	this.object = object;

	this.domElement = ( domElement !== undefined ) ? domElement : document;
	if ( domElement ) this.domElement.setAttribute( 'tabindex', - 1 );

	// API

	this.movementSpeed = 50.0;
	this.rollSpeed = 0.001;

	this.dragToLook = false;
	this.autoForward = false;

	// disable default target object behavior

	// internals

	this.tmpQuaternion = new THREE.Quaternion();

	this.mouseStatus = 0;
	
	this.moveState = { up: 0.0, down: 0.0, left: 0.0, right: 0.0, forward: 0.0, back: 0.0, pitchUp: 0.0, pitchDown: 0.0, yawLeft: 0.0, yawRight: 0.0, rollLeft: 0.0, rollRight: 0.0 };
	this.moveVector = new THREE.Vector3( 0.0, 0.0, 0.0 );
	this.rotationVector = new THREE.Vector3( 0.0, 0.0, 0.0 );

	
	
	
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

		//event.preventDefault();

		switch ( event.keyCode ) {

			case 16: /* shift */ this.movementSpeedMultiplier = .1; break;

		//	case 87: /*W*/ this.moveState.back -= .01; break;
		//	case 83: /*S*/ this.moveState.back += .01; break;

		//	case 65: /*A*/ this.moveState.right -= .01; break;
		//	case 68: /*D*/ this.moveState.right += .01; break;

		//	case 82: /*R*/ this.moveState.up += .01; break;
		//	case 70: /*F*/ this.moveState.up -= .01; break;
		
		case 87: /*W*/ foward =true ; break;
		case 83: /*S*/ back =true ; break;

		case 65: /*A*/ left=true; break;
		case 68: /*D*/ right=true; break;

		case 82: /*R*/ up = true; break;
		case 70: /*F*/down= true; break;
		
		
		
		
		

			//case 38: /*up*/ this.moveState.pitchUp = 1; break;
			//case 40: /*down*/ this.moveState.pitchDown = 1; break;

			//case 37: /*left*/ this.moveState.yawLeft = 1; break;
			//case 39: /*right*/ this.moveState.yawRight = 1; break;
			
			
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

			//case 87: /*W*/ this.moveState.forward += 0; break;
			//case 83: /*S*/ this.moveState.back += 0; break;

			//case 65: /*A*/ this.moveState.left += 0; break;
			//case 68: /*D*/ this.moveState.right += 0; break;

			//case 82: /*R*/ this.moveState.up += 0; break;
			//case 70: /*F*/ this.moveState.down += 0; break;

			case 87: /*W*/ foward =false ; break;
			case 83: /*S*/ back =false ; break;

			case 65: /*A*/ left=false; break;
			case 68: /*D*/ right=false; break;

			case 82: /*R*/ up = false; break;
			case 70: /*F*/down= false; break;
			
			
			
			
			//case 38: /*up*/ this.moveState.pitchUp = 0; break;
		//	case 40: /*down*/ this.moveState.pitchDown = 0; break;

			//case 37: /*left*/ this.moveState.yawLeft = 0; break;
			//case 39: /*right*/ this.moveState.yawRight = 0; break;
			
			
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

		if ( ! this.dragToLook || this.mouseStatus > 0 ) {

			var container = this.getContainerDimensions();
			var halfWidth  = container.size[ 0 ] / 2;
			var halfHeight = container.size[ 1 ] / 2;

			this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
			this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

			this.updateRotationVector();
			this.updateMovementVector();
		}

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
		
		//mrt.makeRotationFromQuaternion (camera.quaternion);
		
		
		if(foward)tmpmove.z=-0.5;
		if(back)tmpmove.z=0.5;
		
		if(right)tmpmove.y=0.1;
		if(left)tmpmove.y =-0.1;
		
		if(up)tmpmove.x=0.1;
		if(down)tmpmove.x =-0.1;
		
		
		//tmpmove.applyMatrix4 ( mrt );
		//tmpmove.applyMatrix4 ( mrt );
		
		//tmpmove.applyMatrix4 ( mrt );//tmpmove.applyMatrix4 ( mrt );
		
		//if(foward)this.moveState.back-=0.1;
		//if(back)this.moveState.back+=0.1;
		
		//if(right)this.moveState.right +=0.1;
		//if(left)this.moveState.right -=0.1;
		
		//if(up)this.moveState.up +=0.1;
		//if(down)this.moveState.up -=0.1;
		
		
		
		var movestatevector = new THREE.Vector3( this.moveState.up, this.moveState.right, this.moveState.back );
		movestatevector.add(tmpmove);


		//console.log(camera);
		
		//Vector3 {x: 0, y: 5, z: 15}
		
		//this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		//this.object.quaternion.multiply( this.tmpQuaternion );
		//mrt.makeRotationFromQuaternion (this.tmpQuaternion);
		
		//var tmpmove=this.moveVector.clone();
		
		//this.moveVector.applyMatrix4 ( mrt );
//		var move =this.moveVector;
		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
//		move.applyQuaternion(this.tmpQuaternion);
		this.moveVector.applyQuaternion(this.tmpQuaternion);
		movestatevector.applyQuaternion(this.tmpQuaternion);
		//console.log(this.moveVector);
			

	//	this.object.translateX(move.x * moveMult );
	//	this.object.translateY( move.y * moveMult );
	//	this.object.translateZ( move.z * moveMult );
		
		//this.moveVector=move;
		
		
		
		this.object.translateX( this.moveVector.x * moveMult );
		this.object.translateY( this.moveVector.y * moveMult );
		this.object.translateZ( this.moveVector.z * moveMult );
		
		
		
		var tmpove = new THREE.Vector3(this.moveVector.x * moveMult,this.moveVector.y * moveMult,this.moveVector.z * moveMult);
		//console.log(tmpove);
		craft.veloicity=tmpove;
		//this.moveVector=tmpmove;
		
		

		
		this.tmpQuaternion.set( this.rotationVector.y * rotMult, this.rotationVector.x * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		//camera.quaternion.multiply( this.tmpQuaternion );
		this.object.quaternion.multiply( this.tmpQuaternion );

		//camera.position.z=(camera.position.z)*Math.cos(this.rotationVector.z * rotMult);
		//this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		//mrt.makeRotationFromQuaternion ( this.tmpQuaternion );
		//camera.position.applyMatrix4 ( mrt );
		
		
//		this.tmpQuaternion.set( this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
		
		
		
		
		
		//this.tmpQuaternion.set( this.rotationVector.y * rotMult, this.rotationVector.x * rotMult, this.rotationVector.z * rotMult, 1 ).normalize();
//		mrt.makeRotationFromQuaternion ( this.tmpQuaternion );
		
		//camera.position.applyMatrix4 ( mrt );
		
		
		

		//console.log( mrt.determinant ()   );
		
	
//		movestatevector.applyMatrix4 ( mrt );
		
		
		//console.log( craft.geometry.vertices.length);
	
		/*for (var vertexIndex = 0; vertexIndex < craft.geometry.vertices.length; vertexIndex++){        				
			var localVertex = craft.geometry.vertices[vertexIndex].clone();
			//console.log(localVertex);
			var globalVertex = localVertex.applyMatrix4( craft.matrix ) ;
			//console.log(globalVertex);
			var directionVector = globalVertex.sub( craft.position );
			
			//console.log(craft.position);
			//console.log(globalVertex);
			
			var raycaster = new THREE.Raycaster( craft.position, directionVector.clone().normalize(), 2,5 );

			var intersects = raycaster.intersectObject( world);
			
			if (intersects.length>0)
			for ( var i = 0; i < intersects.length; i++ ) {
				//console.log(i);
				//intersects[ i ].object.material.color.set( 0xff0000 );
				//intersects.faceNormal = THREE.Triangle.normal( vA, vB, vC );
				var f=new THREE.Vector3();
				var dir = new THREE.Vector3();
				var dir1 = new THREE.Vector3();
				
				dir1=intersects[ i ].face.normal.clone();
				dir=dir1.clone();
				console.log(intersects[ i ].face);
				
				
				
				//var material = new THREE.MeshStandardMaterial( { color : 0x00cc00 } );
				//var geom = new THREE.Geometry();
				//var hit = intersects[ i ].face.clone();
				//hit.color=   0xffaa00 ;
				var arrowHelper = new THREE.ArrowHelper( dir1, intersects[ i ].point , 20 , 0xff00ff );
				scene.add( arrowHelper );
				
				//geom.faces.push( hit );
				
				//scene.add( new THREE.Mesh( geom, material ) );
				
			//	console.log(movestatevector);

				//console.log(dir);
			
				//var m3 = new THREE.Matrix3();
				//m3.setFromMatrix4 ( m42 );
				//dir.applyMatrix3 ( mrt3 );
				//dir.multiplyScalar ( 2 ); 
				console.log("fffff");
				
				//dir.x-=(dir.x)*2;
				//dir.y-=(dir.y)*2;
				//dir.z-=(dir.z)*2;
				//this.tmpQuaternion.set( 1, 1, 1, 1 ).normalize();
				//mrt.makeRotationFromQuaternion ( this.tmpQuaternion );
				//dir.applyMatrix3 ( m42 );
				//dir.applyMatrix3 ( m42 );
				//
				//dir.x/=10;
				//dir.y/=10;
				//dir.z/=10;
				//movestatevector.sub(dir);
				
				
				var  fxf = new THREE.Matrix4(); 
				fxf.makeScale ( -1, 1, 1 );
				
				
				
				var rot = new THREE.Vector3(0,0,1);

				//dir.applyAxisAngle (rot,Math.PI/2);
				
				//dir.applyMatrix4 ( fxf );
				console.log(this.object.rotation);
				fxf.makeRotationFromEuler (this.object.rotation);
				
				dir.applyMatrix4 ( fxf );
				//dir.applyMatrix4(reflect);
				//console.log(dir);
				
				
				var a=dir.y;
				var b=dir.x ;
				var c=dir.z; 
				
				var  reflect = new THREE.Matrix4(); 
				reflect.set( 	(c*c)+(b*b)-(a*a), a*b*-2,			a*c*-2, 	0,
						a*b*-2, 		(c*c)+(a*a)-(b*b), 	b*c*-2,	 	0,
						a*c*-2, 			b*c*-2,		(b*b)+(a*a)-(c*c),		 	0,
						0, 					0, 				0, 		 	1 );

				fxf.makeScale(-.9,-.9,-.9);
				//movestatevector.x=0;
				//movestatevector.y=0;
				//movestatevector.z=0;
				//movestatevector.sub(dir);
				//movestatevector.applyMatrix4 ( fxf );
				//movestatevector.applyMatrix4 ( reflect );
				
				//dir.x=0;
				//dir.z=0;
				//dir.y=0;
				
				console.log(movestatevector);
				
				//dir.applyAxisAngle (rot,Math.pi);
				//dir=null;
				//dir.x=0;
				//dir.z=0;
				//dir.y=0;
				
				
				var inside=craft.geometry.boundingSphere.radius-intersects[ 0 ].distance;
				dir=intersects[ 0 ].face.normal.clone(); 
				
				
				var x =dir.x;
				var y =dir.y;
				var z =dir.z;
				
				dir.x=y;
				dir.y=z;
				dir.z=x;
				
				var m41 = new THREE.Matrix4();
				var m42 = new THREE.Matrix4();
				m41.makeRotationX(Math.PI/2); 
				m42.makeRotationY(Math.PI/2);
				
				m41.multiply (m42);
				m41.makeRotationZ(Math.PI/2); 
				//m42.makeRotationZ(Math.PI/2); 
				//m41.multiply (m42);
				
				//dir.applyMatrix4 ( m41 );
				
				console.log(dir);
				var force= dir.clone().setLength(inside) ;
							
				//movestatevector.sub((force.multiplyScalar(1)));
				//movestatevector.divideScalar( 1.2);
				//movestatevector=new THREE.Vector3(0,0,0);
				
				console.log(movestatevector);
				vertexIndex=100;
				break;
			}

			//var collisionResults = ray.intersectObjects( world );
			//var collisionResults =raycaster.intersectObject( world )
			//if ( collisionResults.length > 0 && collisionResults[0].distance < directionVector.length() ) 
			//{

			//}
		}*/
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
				
				//var arrowHelper = new THREE.ArrowHelper( intersects[ 0 ].face.normal.clone().multiplyScalar(-1).applyQuaternion(this.tmpQuaternion), craft.position.clone() , 20 , 0xff00ff );
				//scene.add( arrowHelper );
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
					// var arrowHelper = new THREE.ArrowHelper( dist.clone().normalize().multiplyScalar(-1).applyQuaternion(this.object.quaternion), craft.position.clone() , 20 , 0xff00ff );
					//scene.add( arrowHelper );
					
					//console.log(world);

					
				}
			}
			catch(e){
				
			}
			
		/*	var dist=objects[i].position.clone().sub(craft.position);
			if (dist.length()<30){
				//console.log("ffffffffffff");
				for (var vertexIndex = 0; vertexIndex < craft.geometry.vertices.length; vertexIndex++){
					var l = craft.geometry.vertices[vertexIndex].clone();
					var g = l.applyMatrix4( craft.matrix ) ;
					var d = g.sub( craft.position );
				
					var raycaster = new THREE.Raycaster( craft.position, d.clone().normalize(), 2,5 );

					var inter = raycaster.intersectObject( objects[i]);
					if (inter.length>0){
						console.log(inter[0]);
						console.log(d.lengthSq());
						console.log(d.length());
						var norm= inter[ 0 ].face.normal.clone();
						
						objects[i].velocity=craft.veloicity.clone().multiplyScalar(2);
						movestatevector.multiplyScalar(.5);
						var arrowHelper = new THREE.ArrowHelper( norm, inter[ 0 ].point , 20 , 0xff00ff );
						scene.add( arrowHelper );
						
						
					}
				}
				
				
			}	*/
		}
						
		
		
		this.moveState.up = movestatevector.x;
		this.moveState.right= movestatevector.y;
		this.moveState.back= movestatevector.z;
		
		
		
		
		
		this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );
		
		



	};

	this.updateMovementVector = function() {

		var forward = ( this.moveState.forward || ( this.autoForward && ! this.moveState.back ) ) ? 1 : 0;

		this.moveVector.x = ( - this.moveState.left    + this.moveState.right );
		this.moveVector.y = ( - this.moveState.down    + this.moveState.up );
		this.moveVector.z = ( - forward + this.moveState.back );
		
		

		//console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );

	};

	this.updateRotationVector = function() {
		
		this.rotationVector.x = ( - this.moveState.pitchDown + this.moveState.pitchUp );
		this.rotationVector.y = ( - this.moveState.yawRight  + this.moveState.yawLeft );
		this.rotationVector.z = ( - this.moveState.rollRight + this.moveState.rollLeft );
		
		
		
		
		//console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );

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
