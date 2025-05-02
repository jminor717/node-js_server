class UserInputState {
    constructor(roleRate) {
        this.moveUp = false;
        this.moveDown = false;
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.activeDecelerate = false;
        this.rollLeft = 0;
        this.rollRight = 0;
        this.defaultRollRate = roleRate;
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

            case 81: /*Q*/ this.rollLeft = this.defaultRollRate; break;
            case 69: /*E*/ this.rollRight = this.defaultRollRate; break;

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = true; break;
            // case 32: // space
            //     if (canJump === true) velocity.y += 350;
            //     canJump = false;
            //     break;
            case 32: /*space*/ single(1, 0.05, 300, 500);
            case 71: /*g*/ explosion(controls.getObject().position, 1000, 900, 8);
            default:
                break;
        }
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

            case 81: /*Q*/ this.rollLeft = 0; break;
            case 69: /*E*/ this.rollRight = 0; break;

            case 16: /*ctrl*/
            case 88: /*X*/ this.activeDecelerate = false; break;
            default:
                break;
        }
    };
}

export {  UserInputState };