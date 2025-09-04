import { Builder, Craft } from './builder.js';
import { ServerNetwork, UUID } from './serverNetworking.js';
import { UserInputState } from './controls.js';


const NetworkUpdates = Object.freeze({
    PLAYER_JOIN: { ID: 1, LENGTH: 1 }, // sent by player to all
    PLAYER_LEAVE: { ID: 2, LENGTH: 1 }, // sent by player to all
    PLAYER_MOVE: { ID: 3, LENGTH: 1 }, // sent by player to all
    FIRE: { ID: 4, LENGTH: 1 }, // sent by player to all
    HIT: { ID: 5, LENGTH: 1 }, // player reports hits to self and hits they made on non player objects
    // server tracks 
    OBJECT_MOVE: { ID: 6, LENGTH: 1 }, // server tracks all non player objects 

});

let NetworkPacketStructure = {
    type: NetworkUpdates.PLAYER_JOIN.ID,
    data: {}
}

class GameLoop {
    /**
     * 
     * @param {Craft} craftMesh 
     * @param {*} camera 
     * @param {UserInputState} UserInputs 
     * @param {ServerNetwork} Server 
     */
    constructor(craftMesh, camera, UserInputs, Server) {
        this.craft = craftMesh;
        this.camera = camera;
        this.UserInputs = UserInputs;
        this.server = Server;
        this.server.receiveDataFromPlayer = (data, from) => { this.receiveDataFromPlayer(data, from) }
    }

    receiveDataFromPlayer(data, from){
        switch (data.type) {
            case NetworkUpdates.PLAYER_JOIN.ID:
                break;
            case NetworkUpdates.PLAYER_LEAVE.ID:
                break;
            case NetworkUpdates.PLAYER_MOVE.ID:
                break;
            default:
                break;
        }
    }

    networkLoop() {
        // send player actions to all clients
        // server determines final outcome of those actions and sends those to other players
        // this.craft.position
        this.server.sendToPlayers({ type: NetworkUpdates.PLAYER_JOIN.ID, data: this.craft.position })
    }

    mainLoop() {
        // enable teleport
        //phy_craft.disablePreStep = false;
        //phy_craft.transformNode.position or setAbsolutePosition
        this.craft.applyRotationToCamera(this.camera);

        // set angular damping to keep oscillations from building up
        this.craft.physicsBody.setAngularDamping(10);


        if (this.UserInputs.IsLocked === true) {
            let tmpMove = this.UserInputs.UserControlVector.clone();
            let deceleration = new BABYLON.Vector3(0, 0, 0); 

            // let userRotation = 0; if (this.UserInputs.rollLeft) userRotation = 0.4; if (this.UserInputs.rollRight) userRotation = -0.4;
            // userRotation *= 0.1; this.camera.rotateOnAxis(new THREE.Vector3(0, 0, 1), userRotation)

            if (this.UserInputs.activeDecelerate) {
                let velocity = this.craft.physicsBody.getLinearVelocity(0);
                deceleration = velocity.negate().normalizeFromLength(0.1); // TODO not aligned properly, causes acceleration wen looking in different direction
                // console.log(velocity, deceleration)
            }
            tmpMove.applyRotationQuaternionInPlace(this.craft.mesh.rotationQuaternion);
            tmpMove.addInPlace(deceleration);
            // tmpMove.scaleInPlace(controlAuthority);

            if (this.UserInputs.AnyActiveDirectionalInputs()) {
                this.craft.physicsBody.applyImpulse(tmpMove, this.craft.position);
            }
        }
    }
}

export { GameLoop };
