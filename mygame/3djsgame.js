if ( ! Detector.webgl ) {
				Detector.addGetWebGLMessage();
				document.getElementById( 'container' ).innerHTML = "";
			}
			var container, stats;
			var camera, controls, scene, renderer , mouse ,raycaster,intersected;
			var mesh;
			var objects=[];
			//var objectarray=[[[[]]]];
			var objectarray=[];
			
			var bullets=[];
			var targetmesh;
			var worldWidth = 64, worldDepth = 64;
			var clock = new THREE.Clock();
			var cardinals=[];
			
			rayFloor = new THREE.Raycaster();
            rayFloor.ray.direction.set( 0, -1, 0 );

            rayWall = new THREE.Raycaster();
            rayWall.ray.direction.set(0,0,1);
			
			
			
			
			//var craft = new THREE.Mesh( craftgeom, new THREE.MeshLambertMaterial( { color: 0xe8e5e5} ) );
			
			
			
			var craftgeom = new THREE.SphereGeometry( 4, 20, 20 );
			//var craftgeom = new THREE.BoxGeometry( 5, 5, 5);
			craftgeom.computeBoundingSphere();
				for ( var i = 0, l = craftgeom.faces.length; i < l; i ++ ) {

					var face = craftgeom.faces[ i ];
					face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );
					face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

				}

				

					var coloredMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: THREE.VertexColors } );
					coloredMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

					var craft = new THREE.Mesh( craftgeom, coloredMaterial );
					craft.mass=80;


				
			
				var matrix = new THREE.Matrix4();
				var pxGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				pxGeometry.attributes.uv.array[ 1 ] = 0.5;
				pxGeometry.attributes.uv.array[ 3 ] = 0.5;
				pxGeometry.rotateY( Math.PI / 2 );
				pxGeometry.translate( 2, 0, 0 );
				var nxGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				nxGeometry.attributes.uv.array[ 1 ] = 0.5;
				nxGeometry.attributes.uv.array[ 3 ] = 0.5;
				nxGeometry.rotateY( - Math.PI / 2 );
				nxGeometry.translate( - 2, 0, 0 );
				var pyGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				pyGeometry.attributes.uv.array[ 5 ] = 0.5;
				pyGeometry.attributes.uv.array[ 7 ] = 0.5;
				pyGeometry.rotateX( - Math.PI / 2 );
				pyGeometry.translate( 0, 2, 0 );
				var nyGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				nyGeometry.attributes.uv.array[ 5 ] = 0.5;
				nyGeometry.attributes.uv.array[ 7 ] = 0.5;
				nyGeometry.rotateX(  Math.PI / 2 );
				nyGeometry.translate( 0, -2, 0 );
				var pzGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				pzGeometry.attributes.uv.array[ 1 ] = 0.5;
				pzGeometry.attributes.uv.array[ 3 ] = 0.5;
				pzGeometry.translate( 0, 0, 2 );
				var nzGeometry = new THREE.PlaneBufferGeometry( 4, 4 );
				nzGeometry.attributes.uv.array[ 1 ] = 0.5;
				nzGeometry.attributes.uv.array[ 3 ] = 0.5;
				nzGeometry.rotateY( Math.PI );
				nzGeometry.translate( 0, 0, -2 );
				//
				// BufferGeometry cannot be merged yet.
				var tmpGeometry = new THREE.Geometry();
				var pxTmpGeometry = new THREE.Geometry().fromBufferGeometry( pxGeometry );
				var nxTmpGeometry = new THREE.Geometry().fromBufferGeometry( nxGeometry );
				var pyTmpGeometry = new THREE.Geometry().fromBufferGeometry( pyGeometry );
				var nyTmpGeometry = new THREE.Geometry().fromBufferGeometry( nyGeometry );
				var pzTmpGeometry = new THREE.Geometry().fromBufferGeometry( pzGeometry );
				var nzTmpGeometry = new THREE.Geometry().fromBufferGeometry( nzGeometry );
			
				for ( var i = 0; i < 50 ; i ++ ) {
					
						var h  = Math.random() * 50;
						var x = Math.random() * 50;
						var z = Math.random() * 500;
						matrix.makeTranslation(
							x * 1 - 25,
							h * 1 - 25,
							z * 1 -250
						);
						var px = 1;
						var nx = 1;
						var pz = 1;
						var nz = 1;
						tmpGeometry.merge( pyTmpGeometry, matrix );
						tmpGeometry.merge( nyTmpGeometry, matrix );
						if ( ( px !== h && px !== h + 1 ) || x === 0 ) {
							tmpGeometry.merge( pxTmpGeometry, matrix );
						}
						if ( ( nx !== h && nx !== h + 1 ) || x === worldWidth - 1 ) {
							tmpGeometry.merge( nxTmpGeometry, matrix );
						}
						if ( ( pz !== h && pz !== h + 1 ) || z === worldDepth - 1 ) {
							tmpGeometry.merge( pzTmpGeometry, matrix );
						}
						if ( ( nz !== h && nz !== h + 1 ) || z === 0 ) {
							tmpGeometry.merge( nzTmpGeometry, matrix );
						}
					
				}
				
				
				var worldgeometry = new THREE.BufferGeometry().fromGeometry( tmpGeometry );
			
				worldgeometry.computeBoundingSphere();
				
				var colorMaterial = new THREE.MeshPhongMaterial( { specular: 0xccffff, flatShading: true, vertexColors: THREE.VertexColors } );
					colorMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 );

				//
				targetmesh = new THREE.Mesh( worldgeometry, colorMaterial);
				
				
				var worldtgeom = new THREE.BoxGeometry( 50, 50, 500);
				var world
				var world = new THREE.Mesh( worldtgeom, colorMaterial);
				world.receiveShadow=true;
				world.mass=Infinity;
				world.material.side = THREE.BackSide;
				
				camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 200000 );
				camera.position.z = 20; // this is relative to the cube's position
				camera.position.y = 8;
			
			init();
			animate();
			function init() {
			
			//var tmparr=[];
			//for(var x=0;x<200;x++){
//objectarray.push(tmparr);
			//	//for (var y=0;y<200;y++){
			//		objectarray[x].push([]);
			//		objectarray[x][x].push([]);
				//}
			//}
			//objectarray[10][19][10]=0;
	/*		
			objectarray = new Array();
			for(var x=0;x<200;x++){
			objectarray[x] = new Array();
				for(var y=0;y<200;y++){
					objectarray[x][y] = new Array();
					for(var z=0;z<200;z++){
						objectarray[x][y][z] = new Array();
					
					}	
				}	
			}
			objectarray[0] = new Array();
			objectarray[0][0] = new Array();
			objectarray[0][0][0]=new Array();
			//objectarray[5][5][5]=8;
			console.log(objectarray);
	*/

				container = document.getElementById( 'container' );
				scene = new THREE.Scene();
				scene.add( craft );
				
				craft.add(camera);
				
				controls = new THREE.FlyControls( craft );

				controls.movementSpeed = 1;
				controls.domElement = container;
				controls.rollSpeed = .8;
				controls.autoForward = false;
				controls.dragToLook = true;

				
				
				//scene.add( targetmesh );
				
				//var geometry = new THREE.BoxBufferGeometry( 5, 5, 5 );
				var geometry = new THREE.SphereGeometry( 2, 50, 50);
				//BoxGeometry
				geometry.computeBoundingSphere();

				for ( var i = 0; i < 1000; i ++ ) {

					var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );

					object.position.x = Math.random() * 44 - 22;
					object.position.y = Math.random() * 44 - 22;
					
					//object.position.y = Math.random() * 250 - 125;
					
					object.position.z = Math.random() * 450 - 225;
					//object.position.x =0;
					//object.position.y =0;
					//object.position.z = 0;
					
					//object.scale.x = Math.random() + 0.5;
					//object.scale.y = Math.random() + 0.5;
					//object.scale.z = Math.random() + 0.5;
					object.mass=Math.random()*5;
					object.velocity=new THREE.Vector3(0,0,0);
					object.velocity.x = Math.random()*2-1;
					object.velocity.y = Math.random()*2-1;
					object.velocity.z = Math.random()*2-1;
					//console.log(object);
					object.castShadow = true;
					objects[i]=object;
			/*		
					var xt=(Math.floor(Math.floor(object.position.x)/10))+100;
					var yt=(Math.floor(Math.floor(object.position.y)/10))+100;
					var zt=(Math.floor(Math.floor(object.position.z)/10))+100;
					
					console.log(xt+"  "+yt+"  "+zt);
					
					objectarray[xt][yt][zt].push(object);
					console.log(objectarray[xt][yt][zt]);
					//console.log(objectarray);
			*/		
					
					scene.add( object );

				}
				//scene.add( objects );
//console.log(objectarray);
				
				
				cardinals.push(new THREE.Vector3(1,0,0));
				cardinals.push(new THREE.Vector3(-1,0,0));
				cardinals.push(new THREE.Vector3(0,1,0));
				cardinals.push(new THREE.Vector3(0,-1,0));
				cardinals.push(new THREE.Vector3(0,0,1));
				cardinals.push(new THREE.Vector3(0,0,-1));
				
				
				
				
				raycaster = new THREE.Raycaster();

				mouse = new THREE.Vector2();
				

				scene.background = new THREE.Color( 0xa0a0a0 );
				// sides
				
			
				scene.add( world );
				var ambientLight = new THREE.AmbientLight( 0x404040 ,1);
				scene.add( ambientLight );
		
		//		var directionalLight = new THREE.DirectionalLight( 0x008000, 10 );
		//		directionalLight.position.set( -1, 1, 0.5 ).normalize();
		//		scene.add( directionalLight );
		//		var directionalLight = new THREE.DirectionalLight( 0x800000, 10 );
		//		directionalLight.position.set( 1,-1, 0.5 ).normalize();
		//		scene.add( directionalLight );
				
				
				
				var light = new THREE.HemisphereLight( 0xcfcfcf, 0x440000, 0.75 );
				light.position.set( 0.5, 1, 0.75 );
				light.castShadow = true;          
				

				
				
				scene.add( light );
				
				
				renderer = new THREE.WebGLRenderer();
				renderer.setPixelRatio( window.devicePixelRatio );
				renderer.setSize( window.innerWidth, window.innerHeight );
				container.innerHTML = "";
				container.appendChild( renderer.domElement );
				stats = new Stats();
				container.appendChild( stats.dom );
				//
				document.addEventListener( 'mousedown', onDocumentmousedown, false );
				window.addEventListener( 'resize', onWindowResize, false );
			}
			function onWindowResize() {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight );
				controls.handleResize();
			}
			
			function onDocumentmousedown( event ) {

				event.preventDefault();
				
				
				//bullets
				
				raycaster.setFromCamera( mouse, camera );

				var intersects = raycaster.intersectObjects( scene.children );
				var vel =new THREE.Vector3();
				
				
				if ( intersects.length > 0 ) {

					var intersect = intersects[ 0 ];
					var poin = intersect.point;
					vel= new THREE.Vector3(
					poin.x-craft.position.x,
					poin.y-craft.position.y,
					poin.z-craft.position.z
				);
				vel.normalize();

				} 
				
				
				var bullet = new THREE.Mesh(
					new THREE.SphereGeometry(.5,8,8),
					new THREE.MeshBasicMaterial({color:0xfffccf})
				);
				
				bullet.position.set(
					craft.position.x,
					craft.position.y,
					craft.position.z
				);
				var mate = new THREE.Matrix4();
				mate.makeRotationFromQuaternion  (camera.quaternion );
				bullet.velocity = new THREE.Vector3(
					0,
					0,
					-1
				);
				//bullet.velocity = vel;
				bullet.velocity.applyMatrix4(mate);
				console.log(craft);
				bullet.velocity.add(craft.veloicity);
				//bullet.velocity=pointing;
				console.log(camera);
				bullets.push(bullet);
				scene.add(bullet);
				
	
			}
			
		
			//
			function animate() {
				requestAnimationFrame( animate );
				//console.log(world);
				for(var index=0; index<bullets.length; index+=1){
					//if( bullets[index] === undefined ) {
						
		
					bullets[index].position.add(bullets[index].velocity);
					
					
					
					raycaster = new THREE.Raycaster( bullets[index].position.clone(), bullets[index].velocity.clone().normalize(), 2,5 );
					var intersects = raycaster.intersectObjects( objects );
				
					if ( intersects.length > 0 ) {

						if ( intersected != intersects[ 0 ].object ) {
					
							intersected = intersects[ 0 ].object;
							scene.remove( intersected );
						}
	
					} 
					
					//}
				}
				
				/*
				for(var x=1;x<200;x++){
					for(var y=1;y<200;y++){
						for(var z=1;z<200;z++){
							for(var w=0;w<objectarray[x][y][z].length;w++){
								if(objectarray[x][y][z].length>0){
									//console.log(objectarray[x][y][z][w]);
									var tmpobj=[];
									for(var x1=x-1;x1>x+1;x++){
										for(var y1=y-1;y1>y+1;y++){
											for(var z1=z-1;z1>z+1;z++){
												if(objectarray[x1][y1][z1].length>0){
													for(var q=0;q<objectarray[x1][y1][z1].length;q++){
														tmpobj.push(objectarray[x1][y1][z1][q])
													}
													
												}
											}
										}
									}
									if(tmpobj.length>0)
										console.log(tmpobj.length );
									
								}
							}
						}
						
					}
				
				}
				//console.log(objectarray[100][100][100]);
				*/
			
				
				
				
				
				
				for(var i=0; i<objects.length;i++){//colision detection for objects
				
					for(var v=0; v<objects.length;v++){ //colision detection between targets
						if(v!=i){
							//if(objects[i].velocity.length()>0){
							
							
								var dist=objects[i].position.clone().sub(objects[v].position);
								var inside=dist.length();
								var totalr= objects[i].geometry.boundingSphere.radius+objects[v].geometry.boundingSphere.radius;
								inside-=totalr;
								if (inside<0){
									
									//console.log(dist);
									var force= dist.clone().setLength(inside) ;
									
									objects[i].velocity.sub(force.divideScalar( objects[i].mass ));
									objects[v].velocity.add(force.divideScalar( objects[v].mass ));
									objects[i].velocity.divideScalar( 1.1);
									objects[v].velocity.divideScalar( 1.1);
								}
						
						}	
					}
					//cardinals
					for (var j=0;j<cardinals.length;j++){					
						var direct= cardinals[j].clone().sub( objects[i].position );
						//console.log(direct);
						var raycaster = new THREE.Raycaster( objects[i].position, cardinals[j].clone().normalize(), 0, objects[i].geometry.boundingSphere.radius);

						var intersects = raycaster.intersectObject( world);
						//console.log(direct);
						
						if (intersects.length>0){
							var inside=objects[i].geometry.boundingSphere.radius-intersects[ 0 ].distance;
							var dir=intersects[ 0 ].face.normal.clone(); 
							var force= dir.clone().setLength(inside) ;
							
							objects[i].velocity.sub(force );
							objects[i].velocity.divideScalar( 1.1);
						}
					}
				}
				
				
				
				
				render();
				stats.update();
			}
			function render() {
			
			
				controls.update( clock.getDelta(),craft,world ,scene,camera,objects);
				renderer.render( scene, camera );
			}