import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.21/+esm';

"use strict";
class UserInputState {
    /**
     * @param {HTMLElement} canvas 
     */
    constructor(canvas, PauseUi) {
        this.ForwardThrust = 1;
        this.ReverseThrust = 1;
        this.SideThrust = 0.5;

        this.moveUp = false;
        this.moveDown = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.activeDecelerate = false;
        this.canvas = canvas;
        this.PauseUi = PauseUi;
        this.IsLocked = false;
        this.Locked = () => { console.log("pointer locked"); }
        this.UnLocked = () => { console.log("pointer __unlocked"); }
        this.Space = () => {  }
        this.UserControlVector = new BABYLON.Vector3(0, 0, 0);
        this.GuiControls = {
            number1: 1,
            number2: 50, 
            createServer: () => console.log("test"),
            joinServer: () => console.log("test"),
            listServers: () => console.log("test"),
            serverName: "test",
            knownServers: "[]",
        }
    }

    setupPointerLock() {
        // when element is clicked, we're going to request a

        let UiOnClick = () => {
            this.canvas.requestPointerLock = this.canvas.requestPointerLock || this.canvas.mozRequestPointerLock || this.canvas.webkitRequestPointerLock;
            // Ask the browser to lock the pointer)
            this.canvas.requestPointerLock();
        };

        this.canvas.onclick = UiOnClick;
        this.PauseUi.onclick = UiOnClick

        let lockChangeAlert = () => {
            this.IsLocked = document.pointerLockElement === this.canvas;
            if (this.IsLocked) {
                this.Locked();
            } else {
                this.UnLocked();
            }
        }

        document.addEventListener("pointerlockchange", lockChangeAlert, false);
        this.Locked = () => { this.PauseUi.style.display = "none"; gui.hide(); }
        this.UnLocked = () => { this.PauseUi.style.display = "block"; gui.show(); }


        const gui = new GUI();

        gui.add(this.GuiControls, 'number1', 0, 1); // min, max
        gui.add(this.GuiControls, 'number2', 0, 100, 10); // min, max, step
        gui.add(this.GuiControls, 'serverName');
        gui.add(this.GuiControls, 'createServer');
        gui.add(this.GuiControls, 'joinServer');
        gui.add(this.GuiControls, 'listServers');
        gui.add(this.GuiControls, 'knownServers').listen();
        // gui.onChange(event => {
        //     event.object     // object that was modified
        //     event.property   // string, name of property
        //     event.value      // new value of controller
        //     event.controller // controller that was modified
        // });



    }

    AnyActiveDirectionalInputs = () =>
        this.moveForward || this.moveLeft || this.moveBackward || this.moveRight || this.moveUp || this.moveDown
        || this.rollLeft || this.rollRight || this.activeDecelerate;

    onKeyDown(event) {
        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*w*/ this.moveForward = true; break;
            case 37: /*left*/
            case 65: /*a*/ this.moveLeft = true; break;
            case 40: /*down*/
            case 83: /*s*/ this.moveBackward = true; break;
            case 39: /*right*/
            case 68: /*d*/ this.moveRight = true; break;

            case 82: /*R*/ this.moveUp = true; break;
            case 70: /*F*/ this.moveDown = true; break;

            // case 81: /*Q*/ this.rollLeft = this.defaultRollRate; break;
            // case 69: /*E*/ this.rollRight = this.defaultRollRate; break;

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = true; break;
            case 32: // space
                this.Space();
                break;
            // case 32: /*space*/ single(1, 0.05, 300, 500);
            // case 71: /*g*/ explosion(controls.getObject().position, 1000, 900, 8);
            default:
                break;
        }
        this.userInputChanged();
    };

    onKeyUp(event) {
        switch (event.keyCode) {
            case 38: /*up*/
            case 87: /*w*/ this.moveForward = false; break;
            case 37: /*left*/
            case 65: /*a*/ this.moveLeft = false; break;
            case 40: /*down*/
            case 83: /*s*/ this.moveBackward = false; break;
            case 39: /*right*/
            case 68: /*d*/ this.moveRight = false; break;

            case 82: /*R*/ this.moveUp = false; break;
            case 70: /*F*/ this.moveDown = false; break;

            // case 81: /*Q*/ this.rollLeft = 0; break;
            // case 69: /*E*/ this.rollRight = 0; break;

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = false; break;
            default:
                break;
        }
        this.userInputChanged();
    };

    userInputChanged() {
        this.UserControlVector = new BABYLON.Vector3(0, 0, 0);
        if (this.moveForward) this.UserControlVector.z += this.ForwardThrust;
        if (this.moveBackward) this.UserControlVector.z -= this.ReverseThrust;

        if (this.moveRight) this.UserControlVector.x += this.SideThrust;
        if (this.moveLeft) this.UserControlVector.x -= this.SideThrust;

        if (this.moveUp) this.UserControlVector.y += this.SideThrust;
        if (this.moveDown) this.UserControlVector.y -= this.SideThrust;
    }
}

export { UserInputState };