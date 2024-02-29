"use strict";

import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';


// import * as Objects from './CompressedObjects.js';
// import * as Network from './ApplicationLayer.js';
// import * as  physics from 'components/OimoPhysics.js';
// import { AmmoPhysics } from '../three.js/examples/jsm/physics/AmmoPhysics.js';

import { PointerLockControls } from '../NewGameNewLife/Controls.js';
import { RapierPhysics } from './RapierPhysics.js';


console.log("ruyeib")

// airbag, projectile that expands (pushing other objects away, then shrinks back down and and re-expands multiple times as it moves)