import { UserInputState } from './Controls.js';


let UserInputs = new UserInputState(1);
document.addEventListener('keydown', (xvt) => UserInputs.onKeyDown(xvt));
document.addEventListener('keyup', (xvt) => UserInputs.onKeyUp(xvt));

const canvas = document.getElementById("renderCanvas");
// const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
let camera;

let craftProperties = {
    mass: 1,
    inertia: 1,
    gunPositions: [
        new BABYLON.Vector3(-0.7, -0.7, 1),
        new BABYLON.Vector3(0.7, -0.7, 1),
        new BABYLON.Vector3(0.7, 0.7, 1),
        new BABYLON.Vector3(-0.7, 0.7, 1)
    ],
    currentGunIndex: 0
}

const engine = new BABYLON.WebGPUEngine(canvas);
engine.compatibilityMode = false
const createScene = async function () {
    await engine.initAsync(); // only for web gpu
    // https://playground.babylonjs.com/#MZKDQT#5
    // erosion compute shader https://playground.babylonjs.com/?webgpu#C90R62#16

    let gravity = 0;
    let scene = new BABYLON.Scene(engine);
    scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
    // scene.ambientColor = new BABYLON.Color3(200, 0, 10);

    let light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    light.intensity = 0.7;// Default intensity is 1. Let's dim the light a small amount

    let dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 1));
    dirLight.autoCalcShadowZBounds = true;
    dirLight.intensity = 0.2;
    let shadowGen = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGen.bias = 0.01;
    shadowGen.usePercentageCloserFiltering = true;

    // var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // var panel = new BABYLON.GUI.StackPanel();
    // panel.spacing = 5;
    // advancedTexture.addControl(panel);
    // panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    // panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    // panel.paddingLeftInPixels = 10;
    // panel.paddingTopInPixels = 10;
    // panel.width = "30%";


    const havokInstance = await HavokPhysics(); // initialize plugin
    const hk = new BABYLON.HavokPlugin(true, havokInstance); // pass the engine to the plugin
    scene.enablePhysics(new BABYLON.Vector3(0, -gravity, 0), hk); // enable physics in the scene with a gravity
    let physicsEngine = scene.getPhysicsEngine();

    // body/shape on box
    BoxWorld(scene, new BABYLON.Vector3(0, -10, 0), 100, shadowGen);



    // for (const mesh of scene.meshes) { // Modify mesh's geometry to prepare for TRIANGLES mode in plugin
    //     BABYLON.MeshDebugPluginMaterial.PrepareMeshForTrianglesAndVerticesMode(mesh);
    // }
    // for (const material of scene.materials) { // Add plugin to all materials
    //     const plugin = new BABYLON.MeshDebugPluginMaterial(material, {
    //         mode: BABYLON.MeshDebugMode.TRIANGLES,
    //     });
    // }

    let boxShape = new BABYLON.PhysicsShapeBox(new BABYLON.Vector3(0, 0, 0), BABYLON.Quaternion.Identity(), new BABYLON.Vector3(1, 1, 1), scene);
    let instanceBox = BABYLON.MeshBuilder.CreateBox("root", { size: 1 });

    const instance = instancesBody(scene, new BABYLON.Vector3(0, 10, 0), shadowGen, instanceBox, boxShape);

    const positionMatrix = BABYLON.Matrix.Identity();
    positionMatrix.setTranslationFromFloats(0, 10, 0);
    instance.thinInstanceAdd(positionMatrix);

    const color = [Math.random(), Math.random(), Math.random(), 1]
    instance.thinInstanceSetAttributeAt("color", instance.thinInstanceCount - 1, color);
    instance.physicsBody.updateBodyInstances();

    // This creates and positions a free camera (non-mesh)
    // const camera = new BABYLON.ArcFollowCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, sphere, scene );
    // const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));




    const myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
    // Our built-in 'sphere' shape.
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 4 }, scene);
    sphere.position.y = 4;
    sphere.material = myMaterial;
    const shape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), 1, /*radius of the sphere*/ scene);


    //If no colors add colors to sphere
    let colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
        colors = [];
        let positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let p = 0; p < positions.length / 3; p++) {
            // var c = BABYLON.Color3.FromHSV(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            let c = hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            colors.push(c[0], c[1], c[2], 1);
        }
    }
    sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);


    console.log(sphere)
    let phy_sphere = bindBodyShape(sphere, shape, scene, { friction: 0.2, restitution: 1 })
    phy_sphere.game_data = { test: "one", number: 23 }
    // phy_sphere.disablePreStep = false;
    // phy_sphere.setTargetTransform(new BABYLON.Vector3(0, 1, 4), new BABYLON.Quaternion(0, 0, 0, 0))
    phy_sphere.setCollisionCallbackEnabled(true);

    // const observable = phy_sphere.getCollisionObservable();
    const observable = phy_sphere.getCollisionEndedObservable();
    const observer = observable.add((collisionEvent) => {
        // console.log(collisionEvent)
    });

    // myMaterial.markDirty(true)


    const craftMaterial = new BABYLON.StandardMaterial("craftMaterial", scene);
    // Our built-in 'sphere' shape.
    let diameter = 2
    const craft = BABYLON.MeshBuilder.CreateSphere("craft", { diameter: diameter, segments: 4 }, scene); craft.material = myMaterial;
    const craftShape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), diameter / 2, /*radius of the sphere*/ scene);
    console.log(craft);
    craft.position.set(0, 10, -30);

    let phy_craft = bindBodyShape(craft, craftShape, scene, { friction: 0.2, restitution: 1 });
    phy_craft.game_data = { test: "one", number: 23 };
    craftProperties.gunPositions.forEach(gunPosition => {
        const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameterTop: 0.25, diameterBottom: 0.25, tessellation: 8 }, scene);
        cylinder.material = myMaterial;
        cylinder.setParent(craft)
        const cylinderShape = new BABYLON.PhysicsShapeCylinder(
            new BABYLON.Vector3(0, 0, 2), new BABYLON.Vector3(0, 0, 0), 0.125, scene);
        let phy_cylinder = bindBodyShape(cylinder, cylinderShape, scene, { friction: 0.2, restitution: 1 });
        let craftJoint = new BABYLON.LockConstraint(
            gunPosition, new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), scene
        );
        phy_craft.addConstraint(phy_cylinder, craftJoint);
    })


    phy_craft.setMotionType(BABYLON.PhysicsMotionType.STATIC)
    setTimeout(() => {
        phy_craft.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC);
    }, 1000)

    // phy_craft.startsAsleep = true;




    let box1 = BABYLON.Mesh.CreateBox("fixedBox1", 1, scene);
    box1.position.x = 0;
    const col = addMat(box1);

    let box2 = BABYLON.Mesh.CreateBox("fixedBox2", 1, scene);
    box2.position = new BABYLON.Vector3(0, 0, -2);
    addMat(box2, col);

    let joint = new BABYLON.LockConstraint(
        new BABYLON.Vector3(0.5, 0.5, -0.5), new BABYLON.Vector3(-0.5, -0.5, 0.5), new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(0, 1, 0), scene);
    let agg1 = new BABYLON.PhysicsAggregate(box1, BABYLON.PhysicsShapeType.BOX, { mass: 1, restitution: 1 }, scene);
    let agg2 = new BABYLON.PhysicsAggregate(box2, agg1.shape, { mass: 1, restitution: 1 }, scene);
    agg1.body.addConstraint(agg2.body, joint);

    // camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 0, 0), scene);
    camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 0, 0), scene);
    // camera = new BABYLON.FlyCamera("cam", new BABYLON.Vector3(0, 0, 0), scene);
    // camera.keysForward = []
    // camera.keysBackward = []
    // camera.keysDown = []
    // camera.keysUp = []
    // camera.keysLeft = []
    // camera.keysRight = []
    // camera.position = craft.position;

    // camera = new BABYLON.Camera("camera1", new BABYLON.Vector3(0, 5, -10), scene, true);

    // let camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0)); // 3rd person
    camera.minZ = 0.5;
    camera.attachControl(canvas, true);// This attaches the camera to the canvas
    // camera.setTarget(BABYLON.Vector3.Zero());// This targets the camera to scene origin
    // camera.position = craft.position;
    // camera.parent = craft
    // camera.setParent(craft)

    let pivot = new BABYLON.TransformNode("root");
    pivot.position = craft.position;
    camera.parent = pivot;

    setupPointerLock();

    scene.onBeforeRenderObservable.add(() => {
        // enable teleport
        //body.disablePreStep = false;
        //body.transformNode.position or setAbsolutePosition

        // calculate force required to keep the craft object pointing in the direction of the camera
        // console.log(camera, camera.cameraRotation)
        let craftPointing = new BABYLON.Vector3(0, 0, 1);
        let cameraPointing = new BABYLON.Vector3(0, 0, 1);
        craftPointing.applyRotationQuaternionInPlace(craft.rotationQuaternion);
        cameraPointing.applyRotationQuaternionInPlace(camera.absoluteRotation);
        let dif = craftPointing.subtract(cameraPointing);
        phy_craft.applyImpulse(craftPointing, dif);
        phy_craft.applyImpulse(craftPointing.negate(), dif.negate());

        // calculate the force required to keep the craft oriented right side up relative to the camera
        let craftUp = new BABYLON.Vector3(0, 1, 0);
        let cameraUp = new BABYLON.Vector3(0, 1, 0);
        craftUp.applyRotationQuaternionInPlace(craft.rotationQuaternion);
        cameraUp.applyRotationQuaternionInPlace(camera.absoluteRotation);
        let difUp = craftUp.subtract(cameraUp);
        phy_craft.applyImpulse(craftUp, difUp);
        phy_craft.applyImpulse(craftUp.negate(), difUp.negate());

        // set angular damping to keep oscillations from building up
        phy_craft.setAngularDamping(10);

        let tmpMove = new BABYLON.Vector3(0, 0, 0);
        let userRotation = 0;
        let controlAuthority = 0.2;
        // if (controls.isLocked === true) {
        if (UserInputs.moveForward) tmpMove.z += 1;
        if (UserInputs.moveBackward) tmpMove.z -= 1;

        if (UserInputs.moveRight) tmpMove.x += 0.5;
        if (UserInputs.moveLeft) tmpMove.x -= 0.5;

        if (UserInputs.moveUp) tmpMove.y += 0.5;
        if (UserInputs.moveDown) tmpMove.y -= 0.5;

        if (UserInputs.rollLeft) userRotation = 0.4;
        if (UserInputs.rollRight) userRotation = -0.4;
        if (UserInputs.activeDecelerate) {
            let velocity = phy_craft.getLinearVelocity(0);
            let deceleration = velocity.negate().normalizeFromLength(0.4); // TODO not aligned properly, causes acceleration wen looking in different direction
            tmpMove.addInPlace(deceleration);
            console.log(velocity, tmpMove)
        }
        // }


        userRotation *= 0.1;
        // camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), userRotation)
        pivot.rotate(craftPointing, userRotation, BABYLON.Space.WORLD);

        // if (params.lockTarget) {
        //     camera.lookAt(new THREE.Vector3(0, 0, 0));
        // }

        tmpMove.applyRotationQuaternionInPlace(craft.rotationQuaternion);
        tmpMove.scaleInPlace(controlAuthority);
        if (UserInputs.AnyActiveDirectionalInputs()) {
            phy_craft.applyImpulse(tmpMove, craft.position);
        }

    });

    return scene;
};

function addMat(mesh, col = null) {
    mesh.material = new BABYLON.StandardMaterial("mat" + mesh.name);
    if (!col) {
        col = BABYLON.Color3.Random();
    }
    mesh.material.diffuseColor = col;
    return col;
}

//width (x), height (y) and depth (z)
function buildWall(name, dimensions, position, shadowGen, scene) {
    // ground.shape = new BABYLON.PhysicsShapeBox(
    //     new BABYLON.Vector3(0, 0, 0), // center: Vector3,
    //     new BABYLON.Quaternion(0,0,0,0),// rotation: Quaternion,
    //     new BABYLON.Vector3(30, 1, 30),// extents: Vector3,

    let wall = BABYLON.MeshBuilder.CreateBox(name, { width: dimensions.x, height: dimensions.y, depth: dimensions.z }, scene);
    let colors = wall.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
        colors = [];
        let positions = wall.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let p = 0; p < positions.length / 3; p++) {
            // let c = BABYLON.Color3.FromHSV(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            let c = hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            colors.push(c[0], c[1], c[2], 1);
        }
    }
    wall.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    wall.position = position;
    wall.receiveShadows = true;
    let wallShape = new BABYLON.PhysicsShapeBox(new BABYLON.Vector3(0, 0, 0), BABYLON.Quaternion.Identity(), new BABYLON.Vector3(dimensions.x, dimensions.y, dimensions.z), scene);
    let wallBody = new BABYLON.PhysicsBody(wall, BABYLON.PhysicsMotionType.STATIC, false, scene);
    let wallMaterial = { friction: 0.2, restitution: 1 };
    wallShape.material = (wallMaterial);
    wallBody.shape = (wallShape);
    wallBody.setMassProperties({ mass: 0, });
    wallBody.game_data = { bodyType: "wall" }
    shadowGen.addShadowCaster(wall);
}
function BoxWorld(scene, position, size, shadowGen) {
    let cent = size / 2;
    buildWall("ground" + Date.now(), new BABYLON.Vector3(size, 1, size), position, shadowGen, scene);
    buildWall("ceiling" + Date.now(), new BABYLON.Vector3(size, 1, size), position.add(new BABYLON.Vector3(0, size, 0)), shadowGen, scene);
    buildWall("w1" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(-cent, cent, 0)), shadowGen, scene);
    buildWall("w2" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(cent, cent, 0)), shadowGen, scene);
    buildWall("w3" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, -cent)), shadowGen, scene);
    buildWall("w4" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, cent)), shadowGen, scene);
};

function bindBodyShape(mesh, shape, scene, physicsMaterial) {
    let mat = new BABYLON.StandardMaterial("mat", scene);
    mesh.material = mat;
    if (mesh.getDescendants && mesh.getDescendants().length) {
        mesh.getDescendants().forEach((d) => {
            d.material = mat;
        });
    }

    let body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);

    shape.density = 2;
    shape.material = (physicsMaterial);
    body.shape = (shape);
    // body.setMassProperties({ mass: 1 });
    //     centerOfMass: new BABYLON.Vector3(0, 1, 0),
    //     inertia: new BABYLON.Vector3(1, 1, 1),
    //     inertiaOrientation: new BABYLON.Quaternion(0, 0, 0, 1)
    return body;
};

function instancesBody(scene, position, shadowGen, mesh, physicsShape) {
    shadowGen.addShadowCaster(mesh);
    let numPerSide = 2,
        size = 2,
        ofst = 2;

    let m = BABYLON.Matrix.Identity();
    let rm = BABYLON.Matrix.Identity();
    let r = BABYLON.Quaternion.Identity();
    let ridx = [0, 1, 2, 4, 5, 6, 8, 9, 10];
    let index = 0;

    let instanceCount = numPerSide * numPerSide * numPerSide;

    let matricesData = new Float32Array(16 * instanceCount);

    const colorsData = new Float32Array(4 * instanceCount);

    for (let x = 0; x < numPerSide; x++) {
        m.m[12] = -size / 2 + ofst * x + position.x;
        for (let y = 0; y < numPerSide; y++) {
            m.m[13] = -size / 2 + ofst * y + position.y;
            for (let z = 0; z < numPerSide; z++) {
                m.m[14] = -size / 2 + ofst * z + position.z;

                let xr = Math.random() * Math.PI;
                let yr = Math.random() * Math.PI;
                let zr = Math.random() * Math.PI;

                BABYLON.Quaternion.FromEulerAnglesToRef(xr, yr, zr, r);

                r.toRotationMatrix(rm);

                for (let i of ridx) {
                    m.m[i] = rm.m[i];
                }

                colorsData[index * 4] = 0;
                colorsData[index * 4 + 1] = 0;
                colorsData[index * 4 + 2] = 1;
                colorsData[index * 4 + 3] = 1;

                m.copyToArray(matricesData, index * 16);
                index++;
            }
        }
    }

    // Set matrix buffer as non-static
    mesh.thinInstanceSetBuffer("matrix", matricesData, 16, false);
    mesh.thinInstanceSetBuffer("color", colorsData, 4);
    bindBodyShape(mesh, physicsShape, scene, { friction: 0.2, restitution: 1 });
    return mesh;
};

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
    }

    // return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    return [r, g, b];
}
function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}


const _euler = new BABYLON.Vector3(0, 0, 0);
function mouseMove(e) {
    let player;
    let deltaTime = engine.getDeltaTime();
    const mouseSensitivity = 1;



    // player.rotation.x += movementY * deltaTime * 0.001;
    // player.rotation.y -= movementX * deltaTime * 0.001;

    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    
    // console.log(movementY * deltaTime * 0.001, movementX * deltaTime * 0.001)

    let cameraPointing = new BABYLON.Vector3(0, 0, 1);
    cameraPointing.applyRotationQuaternionInPlace(camera.absoluteRotation);

    // let euler = camera.absoluteRotation.toEulerAngles(); 
    cameraPointing.x += movementX * 0.002 * mouseSensitivity;
    cameraPointing.y -= movementY * 0.002 * mouseSensitivity;
    // _euler.x = Math.max(_PI_2 - scope.maxPolarAngle, Math.min(_PI_2 - scope.minPolarAngle, _euler.x));

    console.log(cameraPointing)
    camera.setTarget(camera.position.add(cameraPointing));
    // camera.quaternion.setFromEuler(_euler);
}

function setupPointerLock() {
    // register the callback when a pointerlock event occurs
    // document.addEventListener('pointerlockchange', changeCallback, false);
    // document.addEventListener('mozpointerlockchange', changeCallback, false);
    // document.addEventListener('webkitpointerlockchange', changeCallback, false);

    // when element is clicked, we're going to request a
    // pointerlock
    canvas.onclick = function () {
        canvas.requestPointerLock =
            canvas.requestPointerLock ||
            canvas.mozRequestPointerLock ||
            canvas.webkitRequestPointerLock;

        // Ask the browser to lock the pointer)
        canvas.requestPointerLock();
    };
}

function changeCallback(e) {
    if (document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas
    ) {
        // we've got a pointerlock for our element, add a mouselistener
        document.addEventListener("mousemove", mouseMove, false);
        document.addEventListener("mousedown", mouseMove, false);
        document.addEventListener("mouseup", mouseMove, false);
    } else {
        // pointer lock is no longer active, remove the callback
        document.removeEventListener("mousemove", mouseMove, false);
        document.removeEventListener("mousedown", mouseMove, false);
        document.removeEventListener("mouseup", mouseMove, false);
    }
};

createScene().then((scene) => {
    engine.runRenderLoop(function () {
        if (scene) {
            scene.render();
        }
    });
});
// Resize
window.addEventListener("resize", function () {
    engine.resize();
});