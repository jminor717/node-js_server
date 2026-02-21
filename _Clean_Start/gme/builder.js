"use strict";
let rand = (min, max) => Math.random() * (max - min) + min;
class CraftProperties {
    constructor() {
        this.mass = 1;
        this.inertia = 1;
        this.diameter = 2;
        this.startPosition = new BABYLON.Vector3(Math.random(), Math.random(), Math.random()).normalize().scale(rand(20, 40));
        this.gunPositions = [
                        new BABYLON.Vector3(-0.7, -0.7, 1),
                        new BABYLON.Vector3(0.7, -0.7, 1),
                        new BABYLON.Vector3(0.7, 0.7, 1),
                        new BABYLON.Vector3(-0.7, 0.7, 1)
                    ],
        this.currentGunIndex = 0;
    }
}

class Craft{

    /**
     * 
     * @param {CraftProperties} craftProperties 
     * @param {*} scene 
     * @param {Builder} builder 
     */
    constructor(craftProperties, scene, builder) {
        let baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);

        let mesh = BABYLON.MeshBuilder.CreateSphere("craft", { diameter: craftProperties.diameter, segments: 4 }, scene); 
        mesh.material = baseMaterial;
        const craftShape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), craftProperties.diameter / 2, /*radius of the sphere*/ scene);
        console.log(mesh);
        mesh.position.set(craftProperties.startPosition.x, craftProperties.startPosition.y, craftProperties.startPosition.z);
        let phy_craft = builder.bindBodyShape(mesh, craftShape, scene, { friction: 0.2, restitution: 1 });
        let physicsParts = [];
        phy_craft.game_data = { test: "one", ready: false };
        // phy_craft.setMotionType(BABYLON.PhysicsMotionType.ANIMATED)// DYNAMIC STATIC
        physicsParts.push(phy_craft)
        const warmupTime = 100;
        craftProperties.gunPositions.forEach(gunPosition => {
            const cylinder = BABYLON.MeshBuilder.CreateCylinder("cylinder", { height: 2, diameterTop: 0.25, diameterBottom: 0.25, tessellation: 8 }, scene);
            cylinder.material = baseMaterial;
            cylinder.setParent(mesh);
            cylinder.rotate(new BABYLON.Vector3(1, 0, 0), Math.PI / 2)
            cylinder.position = gunPosition//craft.position.add(gunPosition)
            const cylinderShape = new BABYLON.PhysicsShapeCylinder(
                new BABYLON.Vector3(0, 0, 2), new BABYLON.Vector3(0, 0, 0), 0.125, scene);
            let phy_cylinder = builder.bindBodyShape(cylinder, cylinderShape, scene, { friction: 0.2, restitution: 1 });
            let craftJoint = new BABYLON.LockConstraint(
                gunPosition, new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 1, 0), scene
            );

            phy_cylinder.setLinearDamping(warmupTime)
            phy_cylinder.setAngularDamping(warmupTime)
            physicsParts.push(phy_cylinder);
            phy_craft.addConstraint(phy_cylinder, craftJoint);
        })

        phy_craft.setLinearDamping(warmupTime)
        phy_craft.setAngularDamping(warmupTime)

        let i = warmupTime;
        let warmUp = setInterval(() => {
            if (i <= 0) {
                this.OnReady();
                clearInterval(warmUp);
                return;
            }
            let damp = Math.pow((i / 21.7), 3);
            for (const body of physicsParts) {
                body.setLinearDamping(damp)
                body.setAngularDamping(damp)
            }
            i--
        }, 10);

        scene.shadowGen.addShadowCaster(mesh, true);

        this.mesh = mesh;
        this.position = mesh.position;
        this.physicsBody = phy_craft;
        /** called after the physics joints have settled and the object is stable */
        this.OnReady = () => {};
    }

    applyRotationToCamera(camera){

        // calculate force required to keep the craft object pointing in the direction of the camera
        // console.log(camera, camera.cameraRotation)
        let craftPointing = new BABYLON.Vector3(0, 0, 1);
        let cameraPointing = new BABYLON.Vector3(0, 0, 1);
        craftPointing.applyRotationQuaternionInPlace(this.mesh.rotationQuaternion);
        cameraPointing.applyRotationQuaternionInPlace(camera.absoluteRotation);
        let dif = craftPointing.subtract(cameraPointing);
        this.physicsBody.applyImpulse(craftPointing, dif);
        this.physicsBody.applyImpulse(craftPointing.negate(), dif.negate());

        // calculate the force required to keep the craft oriented right side up relative to the camera
        let craftUp = new BABYLON.Vector3(0, 1, 0);
        let cameraUp = new BABYLON.Vector3(0, 1, 0);
        craftUp.applyRotationQuaternionInPlace(this.mesh.rotationQuaternion);
        cameraUp.applyRotationQuaternionInPlace(camera.absoluteRotation);
        let difUp = craftUp.subtract(cameraUp);
        this.physicsBody.applyImpulse(craftUp, difUp);
        this.physicsBody.applyImpulse(craftUp.negate(), difUp.negate());

    }
}

class Builder {
    /**
     * 
     * @param {*} scene 
     */
    constructor(scene) {
        this.scene = scene;
    }


    buildCraft(craftProperties, isSelf){
        return new Craft(craftProperties, this.scene, this, isSelf);
    }


    single(position, direction, mass, radius, speed)
    {

        let sphere = BABYLON.MeshBuilder.CreateSphere("projectile", { diameter: radius * 2, segments: 4 }, this.scene);
        sphere.position.set(position.x, position.y, position.z);

        let shape = new BABYLON.PhysicsShapeSphere(new BABYLON.Vector3(0, 0, 0), radius, this.scene);

        let body = this.bindBodyShape(sphere, shape, this.scene, { friction: 0.2, restitution: 0.001 });
        body.setMassProperties({ mass: mass });
        body.setLinearVelocity(direction.normalize().scale(speed));
        this.scene.shadowGen.addShadowCaster(sphere);
    }


    bindBodyShape(mesh, shape, scene, physicsMaterial) {
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

    buildWall(name, dimensions, position, shadowGen, scene) {
        // ground.shape = new BABYLON.PhysicsShapeBox(
        //     new BABYLON.Vector3(0, 0, 0), // center: Vector3,
        //     new BABYLON.Quaternion(0,0,0,0),// rotation: Quaternion,
        //     new BABYLON.Vector3(30, 1, 30),// extents: Vector3,

        let vertexData = BABYLON.CreateSegmentedBoxVertexData({ 
            width: dimensions.x, height: dimensions.y, depth: dimensions.z,
            depthSegments: 20, heightSegments: 20, widthSegments: 20 });
        // let vertexCount = ((vertexData.positions.length / 6)*7) / 3;
        let vertexCount = vertexData.positions.length / 3;
        vertexData.colors = [];
        for (let index = 0; index < vertexCount; index ++) {
            
            // let ind = index * 3;
            // if (dimensions.x > 2) 
            //     vertexData.positions[ind] = vertexData.positions[ind] + (Math.random() * 5);
            // if (dimensions.y > 2) 
            //     vertexData.positions[ind + 1] = vertexData.positions[ind + 1] + (Math.random() * 5);
            // if (dimensions.z > 2) 
            //     vertexData.positions[ind + 2] = vertexData.positions[ind + 2] + (Math.random() * 5);

            let c = this.hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            vertexData.colors.push(c[0], c[1], c[2], 1);
        }



        let wall = BABYLON.MeshBuilder.CreateBox(name, { width: dimensions.x, height: dimensions.y, depth: dimensions.z }, scene);
        if (name.includes("ceiling")) {
            let colors = wall.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            if (!colors) {
                colors = [];
                let positions = wall.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                for (let p = 0; p < positions.length / 3; p++) {
                    // let c = BABYLON.Color3.FromHSV(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
                    let c = this.hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
                    colors.push(c[0], c[1], c[2], 1);
                }
            }
            wall.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);
        }


        wall.position = position;

        let rotation = BABYLON.Quaternion.Identity()
        // rotation = new BABYLON.Quaternion(1, 0, 0, 0);

        if (name.includes("ceiling")){
        }else{
            vertexData.applyToMesh(wall, true);
        }

        let wallShape = new BABYLON.PhysicsShapeBox(new BABYLON.Vector3(0, 0, 0), rotation, new BABYLON.Vector3(dimensions.x, dimensions.y, dimensions.z), scene);
        let wallBody = new BABYLON.PhysicsBody(wall, BABYLON.PhysicsMotionType.STATIC, false, scene);
        let wallMaterial = { friction: 0.2, restitution: 0.8 };
        wallShape.material = (wallMaterial);
        wallBody.shape = (wallShape);
        wallBody.setMassProperties({ mass: 0, });
        wallBody.game_data = { bodyType: "wall" }
        wall.receiveShadows = true;
        // shadowGen.addShadowCaster(wall);
    }

    BoxWorld(scene, position, size, shadowGen) {
        let cent = size / 2;
        const overlap = 20;
        size += overlap;
        this.buildWall("ground" + Date.now(), new BABYLON.Vector3(size, 1, size), position, shadowGen, scene);
        this.buildWall("ceiling" + Date.now(), new BABYLON.Vector3(size, 1, size), position.add(new BABYLON.Vector3(0, size - overlap, 0)), shadowGen, scene);
        this.buildWall("w1" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(-cent, cent, 0)), shadowGen, scene);
        this.buildWall("w2" + Date.now(), new BABYLON.Vector3(1, size, size), position.add(new BABYLON.Vector3(cent, cent, 0)), shadowGen, scene);
        this.buildWall("w3" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, -cent)), shadowGen, scene);
        this.buildWall("w4" + Date.now(), new BABYLON.Vector3(size, size, 1), position.add(new BABYLON.Vector3(0, cent, cent)), shadowGen, scene);

        let vertexData = BABYLON.CreateSegmentedBoxVertexData({
            width: 10, height: 10, depth: 10,
            depthSegments: 5, heightSegments: 5, widthSegments: 5
        });
        let vertexCount = vertexData.positions.length / 3;
        // let vertexCount = ((vertexData.positions.length / 6) * 9) / 3;
        vertexData.colors = [];
        for (let index = 0; index < vertexCount; index++) {

            let ind = index * 3;
            vertexData.positions[ind] = vertexData.positions[ind] + (Math.random() * 1);
            vertexData.positions[ind + 1] = vertexData.positions[ind + 1] + (Math.random() * 1);
            vertexData.positions[ind + 2] = vertexData.positions[ind + 2] + (Math.random() * 1);

            let c = this.hslToRgb(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
            vertexData.colors.push(c[0], c[1], c[2], 1);
        }

        // var mesh = BABYLON.MeshBuilder.CreateBox("efe", { width: 10, height: 10, depth: 10 }, scene);
        // vertexData.applyToMesh(mesh, true);

    };

    instancesBody(scene, position, shadowGen, mesh, physicsShape) {
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
        this.bindBodyShape(mesh, physicsShape, scene, { friction: 0.2, restitution: 1 });
        return mesh;
    };

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = this.hueToRgb(p, q, h + 1 / 3);
            g = this.hueToRgb(p, q, h);
            b = this.hueToRgb(p, q, h - 1 / 3);
        }

        // return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        return [r, g, b];
    }
    hueToRgb(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    }

}

export { Builder, Craft, CraftProperties };