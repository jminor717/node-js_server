"use strict";
import { UserInputState } from './controls.js';
import { Builder, Craft } from './builder.js';
import { ServerNetwork, UUID } from './serverNetworking.js';
import { GameLoop } from './gameLoop.js';

"use strict";

function a(val) { return val + 1; }
function b(val) { return val - 1; }
function c(val) { return val * 2 }
var time = performance.now();
for (let i = 0; i < 100000000; i++) { a(b(c(100))); }
console.log(`Elapsed time function calls: ${performance.now() - time}`);
time = performance.now();
let tmp;
for (let i = 0; i < 100000000; i++) { tmp = 100 * 2 + 1 - 1; }
console.log(`Elapsed time NO function calls:  ${performance.now() - time}`);

let elm = new EventTarget()
const event = new Event("build");
elm.addEventListener('build', (e) => { tmp = e * 2 + 1 - 1; }, false);
time = performance.now();
for (var i = 0; i < 1000000; i++) { window.dispatchEvent(event); }
console.log(`Elapsed time events: ${(performance.now() - time) * 100}`);

const canvas = document.getElementById("renderCanvas");
const UserInputs = new UserInputState(canvas);
const builder = new Builder();
document.addEventListener('keydown', (xvt) => UserInputs.onKeyDown(xvt));
document.addEventListener('keyup', (xvt) => UserInputs.onKeyUp(xvt));

// const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, disableWebGL2Support: false });
let camera;

let craftProperties = {
    mass: 1,
    inertia: 1,
    diameter: 2,
    gunPositions: [
        new BABYLON.Vector3(-0.7, -0.7, 1),
        new BABYLON.Vector3(0.7, -0.7, 1),
        new BABYLON.Vector3(0.7, 0.7, 1),
        new BABYLON.Vector3(-0.7, 0.7, 1)
    ],
    currentGunIndex: 0
}
const MyId = new UUID();
console.log(MyId)
const server = new ServerNetwork(MyId);

// const remId = uuidv4();
// const server2 = new ServerNetwork(remId);

// server.getActiveServers();
const engine = new BABYLON.WebGPUEngine(canvas);
engine.compatibilityMode = false

async function testNetwork() {
    await server.isReady;
    let resp = await server.CreateServer("one");
    if (resp.Servers && Object.hasOwnProperty.call(resp.Servers, "one")) {
        // console.log(resp.Servers.one)
        // network.FindIceFor();
        let inServer = await server.JoinServer("one")
    }
}
testNetwork();
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

    const havokInstance = await HavokPhysics(); // initialize plugin
    const hk = new BABYLON.HavokPlugin(true, havokInstance); // pass the engine to the plugin
    scene.enablePhysics(new BABYLON.Vector3(0, -gravity, 0), hk); // enable physics in the scene with a gravity
    let physicsEngine = scene.getPhysicsEngine();

    // body/shape on box
    builder.BoxWorld(scene, new BABYLON.Vector3(0, -10, 0), 100, shadowGen);

    let boxShape = new BABYLON.PhysicsShapeBox(new BABYLON.Vector3(0, 0, 0), BABYLON.Quaternion.Identity(), new BABYLON.Vector3(1, 1, 1), scene);
    let instanceBox = BABYLON.MeshBuilder.CreateBox("root", { size: 1 });

    const instance = builder.instancesBody(scene, new BABYLON.Vector3(0, 10, 0), shadowGen, instanceBox, boxShape);

    const positionMatrix = BABYLON.Matrix.Identity();
    positionMatrix.setTranslationFromFloats(0, 10, 0);
    instance.thinInstanceAdd(positionMatrix);

    const color = [Math.random(), Math.random(), Math.random(), 1]
    instance.thinInstanceSetAttributeAt("color", instance.thinInstanceCount - 1, color);
    instance.physicsBody.updateBodyInstances();

    // This creates and positions a free camera (non-mesh)
    // const camera = new BABYLON.ArcFollowCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, sphere, scene );
    // const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0));


    const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
    // Our built-in 'sphere' shape.
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 4 }, scene);
    sphere.position.y = 4;
    sphere.material = baseMaterial;
    const shape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), 1, /*radius of the sphere*/ scene);


    //If no colors add colors to sphere
    let colors = sphere.getVerticesData(BABYLON.VertexBuffer.ColorKind);
    if (!colors) {
        colors = [];
        let positions = sphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        for (let p = 0; p < positions.length / 3; p++) {
            // var c = BABYLON.Color3.FromHSV(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            let c = builder.hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            colors.push(c[0], c[1], c[2], 1);
        }
    }
    sphere.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);


    console.log(sphere)
    let phy_sphere = builder.bindBodyShape(sphere, shape, scene, { friction: 0.2, restitution: 1 })
    phy_sphere.game_data = { test: "one", number: 23 }
    phy_sphere.setCollisionCallbackEnabled(true);
    // const observable = phy_sphere.getCollisionEndedObservable(); //getCollisionObservable
    // const observer = observable.add((collisionEvent) => { console.log(collisionEvent) });

    const craft = builder.buildCraft(craftProperties, true)

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

    // let camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0)); // 3rd person
    camera = new BABYLON.FlyCamera("cam", new BABYLON.Vector3(0, 0, 0), scene); //FreeCamera, UniversalCamera
    camera.keysForward = []; camera.keysBackward = []; camera.keysDown = []; camera.keysUp = []; camera.keysLeft = []; camera.keysRight = [];
    camera.position = craft.position;
    // camera.position = new BABYLON.Vector3(0, 15, -30);
    // camera.setTarget(craft.position);

    camera.minZ = 0.5;
    camera.attachControl(canvas, true);// This attaches the camera to the canvas

    UserInputs.setupPointerLock();

    let gme_loop = new GameLoop(craft, camera, UserInputs, server)

    craft.OnReady = () => scene.onBeforeRenderObservable.add(() => gme_loop.mainLoop())
    // setInterval(() => { gme_loop.networkLoop() }, 66);
    setInterval(() => { gme_loop.networkLoop() }, 5000);
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