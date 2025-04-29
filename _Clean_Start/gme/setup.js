


const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
const createScene = async function () {
    // https://playground.babylonjs.com/#MZKDQT#5
    let gravity = 0;
    var scene = new BABYLON.Scene(engine);
    scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
    // scene.ambientColor = new BABYLON.Color3(200, 0, 10);

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    light.intensity = 0.7;// Default intensity is 1. Let's dim the light a small amount

    var dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 1));
    dirLight.autoCalcShadowZBounds = true;
    dirLight.intensity = 0.2;
    var shadowGen = new BABYLON.ShadowGenerator(1024, dirLight);
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

    physicsMaterial = { friction: 0.2, restitution: 1 };
    bodyRenderingMaterial = new BABYLON.StandardMaterial("mat", scene);

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


    const instance = instancesBody(scene, new BABYLON.Vector3(0, 10, 0), shadowGen);

    const positionMatrix = BABYLON.Matrix.Identity();
    positionMatrix.setTranslationFromFloats(0, 10, 0);
    instance.thinInstanceAdd(positionMatrix);

    const color = [Math.random(), Math.random(), Math.random(), 1]
    instance.thinInstanceSetAttributeAt("color", instance.thinInstanceCount - 1, color);
    instance.physicsBody.updateBodyInstances();

    // This creates and positions a free camera (non-mesh)
    // const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);
    // const camera = new BABYLON.FollowCamera("camera1", new BABYLON.Vector3(0, 0, 0), scene, sphere)
    // const camera = new BABYLON.ArcFollowCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, sphere, scene );
    // const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));
    // const camera = new BABYLON.Camera("camera1", new BABYLON.Vector3(0, 5, -10), scene, true)




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
    let phy_sphere = bindBodyShape(sphere, shape, scene)
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
    const craft = BABYLON.MeshBuilder.CreateSphere("craft", { diameter: diameter, segments: 4 }, scene);
    const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameterTop: 0.25, diameterBottom: 0.25, tessellation: 8 }, scene);
    cylinder.position.set(0.70711, 0.70711, 1);
    cylinder.rotate(new BABYLON.Vector3(1, 0, 0), Math.PI/2)
    cylinder.material = myMaterial;
    
    cylinder.setParent(craft)
    craft.material = myMaterial;

    craft.position.set(0, 10, -30);
    const craftShape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), diameter/2, /*radius of the sphere*/ scene);
    const cylinderShape = new BABYLON.PhysicsShapeCylinder(
        new BABYLON.Vector3(0.70711, 0.70711, 2),
        new BABYLON.Vector3(0.70711, 0.70711, 0),
        0.125,
        scene,
    )
    console.log(craft)
    let phy_craft = bindBodyShape(craft, craftShape, scene)
    let phy_cylinder = bindBodyShape(cylinder, cylinderShape, scene)
    phy_craft.game_data = { test: "one", number: 23 }


    // cart and Pendulum Joint
    // { x: childMesh.position.x, y: childMesh.position.y, z: childMesh.position.z },
    // { w: 1.0, x: 0.0, y: 0.0, z: 0.0 },
    let PendulumJoint = new BABYLON.LockConstraint(
        cylinder.position.clone(),  //new BABYLON.Vector3(0, 0, 0),// 
        new BABYLON.Vector3(2, 1, -1),
        new BABYLON.Vector3(1, 0, 0),
        new BABYLON.Vector3(0, 0, 1),
        scene
    );
    // PendulumJoint = isCollisionsEnabled = false;
    phy_craft.addConstraint(phy_cylinder, PendulumJoint);

    // phy_craft.addConstraint(phy_cylinder, constraint);

    // new LockConstraint(
    //     pivotA: Vector3,
    //     pivotB: Vector3,
    //     axisA: Vector3,
    //     axisB: Vector3,
    //     scene: Scene,
    // )
    // let camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 10, -30), scene);
    // let camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 0, -30), this.scene);
    let camera = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 0, -30), scene);
    camera.setTarget(BABYLON.Vector3.Zero());// This targets the camera to scene origin
    camera.attachControl(canvas, true);// This attaches the camera to the canvas


    // camera.position = craft.getAbsolutePosition()
    camera.position = craft.position;
    // camera.parent = craft
    // camera.setParent(craft)
    setupPointerLock();

    scene.onBeforeRenderObservable.add(() => {
        // calculate force required to keep the craft object pointing in the direction of the camera
        // console.log(camera, camera.cameraRotation)

        let craftPointing = new BABYLON.Vector3(0, 0, 1);
        let cameraPointing = new BABYLON.Vector3(0, 0, 1);
        craftPointing.applyRotationQuaternionInPlace(craft.rotationQuaternion)
        cameraPointing.applyRotationQuaternionInPlace(camera.absoluteRotation)
        let dif = craftPointing.subtract(cameraPointing)
        phy_craft.applyImpulse(craftPointing, dif)
        phy_craft.applyImpulse(craftPointing.negate(), dif.negate())

        // calculate the force required to keep the craft oriented right side up relative to the camera
        let craftUp = new BABYLON.Vector3(0, 1, 0);
        let cameraUp = new BABYLON.Vector3(0, 1, 0);
        craftUp.applyRotationQuaternionInPlace(craft.rotationQuaternion)
        cameraUp.applyRotationQuaternionInPlace(camera.absoluteRotation)
        let difUp = craftUp.subtract(cameraUp)
        phy_craft.applyImpulse(craftUp, difUp)
        phy_craft.applyImpulse(craftUp.negate(), difUp.negate())

        // set angular damping to keep oscillations from building up
        phy_craft.setAngularDamping(50);

    });

    return scene;
};

//width (x), height (y) and depth (z)
function buildWall(name, dimensions, position, shadowGen, scene) {
    // ground.shape = new BABYLON.PhysicsShapeBox(
    //     new BABYLON.Vector3(0, 0, 0), // center: Vector3,
    //     new BABYLON.Quaternion(0,0,0,0),// rotation: Quaternion,
    //     new BABYLON.Vector3(30, 1, 30),// extents: Vector3,

    let wall = BABYLON.MeshBuilder.CreateBox(name, { width: dimensions.x, height: dimensions.y, depth: dimensions.z }, scene);
    var colors = wall.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
        colors = [];
        var positions = wall.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (var p = 0; p < positions.length / 3; p++) {
            // var c = BABYLON.Color3.FromHSV(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
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
    let cent = size / 2
    buildWall("ground" + Date.now(), new BABYLON.Vector3(size, 1, size), position, shadowGen, scene)
    buildWall("ceiling" + Date.now(), new BABYLON.Vector3(size, 1, size), position.add(new BABYLON.Vector3(0, size, 0)), shadowGen, scene)
    buildWall("w1" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(-cent, cent, 0)), shadowGen, scene)
    buildWall("w2" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(cent, cent, 0)), shadowGen, scene)
    buildWall("w3" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, -cent)), shadowGen, scene)
    buildWall("w4" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, cent)), shadowGen, scene)
};

function bindBodyShape(mesh, shape, scene) {
    mesh.material = bodyRenderingMaterial;
    if (mesh.getDescendants && mesh.getDescendants().length) {
        mesh.getDescendants().forEach((d) => {
            d.material = bodyRenderingMaterial;
        });
    }

    let body = new BABYLON.PhysicsBody(mesh, BABYLON.PhysicsMotionType.DYNAMIC, false, scene);

    shape.material = (physicsMaterial);
    body.shape = (shape);
    body.setMassProperties({ mass: 1 });
    // phy_sphere.setMassProperties({
    //     mass: 1,
    //     centerOfMass: new BABYLON.Vector3(0, 1, 0),
    //     inertia: new BABYLON.Vector3(1, 1, 1),
    //     inertiaOrientation: new BABYLON.Quaternion(0, 0, 0, 1)
    // });
    return body;
};

function instancesBody(scene, position, shadowGen) {
    let box = BABYLON.MeshBuilder.CreateBox("root", { size: 1 });
    shadowGen.addShadowCaster(box);
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
    box.thinInstanceSetBuffer("matrix", matricesData, 16, false);
    box.thinInstanceSetBuffer("color", colorsData, 4);

    let boxShape = new BABYLON.PhysicsShapeBox(
        new BABYLON.Vector3(0, 0, 0),
        BABYLON.Quaternion.Identity(),
        new BABYLON.Vector3(1, 1, 1),
        scene
    );

    bindBodyShape(box, boxShape, scene);
    return box;
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



var player;

function mouseMove(e) {
    deltaTime = engine.getDeltaTime();
    const mouseSensitivity = 0.0003;

    let movementX = e.movementX ||
        e.mozMovementX ||
        e.webkitMovementX ||
        0;

    let movementY = e.movementY ||
        e.mozMovementY ||
        e.webkitMovementY ||
        0;

    console.log(movementY * deltaTime * 0.001, movementX * deltaTime * 0.001)
    // player.rotation.x += movementY * deltaTime * 0.001;
    // player.rotation.y -= movementX * deltaTime * 0.001;
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
            canvas.webkitRequestPointerLock
            ;

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