'use strict';
import * as THREE from 'three';

//https://gist.github.com/DzikuVx/f8b146747c029947a996b9a3b070d5e7
let VectorPidController = function () {

    var self = {},
        privateScope = {};

    /**
     *
     * @type {THREE.Vector3}
     */
    privateScope.target = null;

    /**
     *
     * @type {{P: null, I: null, D: null}}
     */
    privateScope.gains = {
        P: null,
        I: null,
        D: null
    };

    /**
     *
     * @type {THREE.Vector3}
     */
    privateScope.Iterm = new THREE.Vector3(0, 0, 0);

    /**
     *
     * @type {{min: number, max: number}}
     */
    privateScope.ItermLimit = {
        min: -1000,
        max: 1000
    };

    /**
     *
     * @type {number}
     */
    privateScope.minError = 0;

    /**
     *
     * @type {THREE.Vector3}
     */
    privateScope.previousError = new THREE.Vector3(0, 0, 0);

    /**
     *
     * @type {{min: number, max: number, minThreshold: number}}
     */
    privateScope.output = {
        min: null,
        max: null,
        minThreshold: null
    };

    /**
     *
     * @param {THREE.Vector3} value
     */
    self.setTarget = function (value) {
        privateScope.target = value;
    };

    /**
     * @param {number} Pgain
     * @param {number} Igain
     * @param {number} Dgain
     */
    self.setGains = function (Pgain, Igain, Dgain) {
        privateScope.gains.P = Pgain;
        privateScope.gains.I = Igain;
        privateScope.gains.D = Dgain;
    };

    /**
     * Sets min and max value for output
     * @param {number} min
     * @param {number} max
     * @param {number} minThreshold if output is below this value, [min] is returned
     */
    self.setOutput = function (min, max, minThreshold) {
        privateScope.output.min = min;
        privateScope.output.max = max;
        privateScope.output.minThreshold = minThreshold;
    };

    /**
     * Sets upper and lower limit for Iterm accumulator
     * @param {number} min
     * @param {number} max
     */
    self.setItermLimit = function (min, max) {
        privateScope.ItermLimit.min = min;
        privateScope.ItermLimit.max = max;
    };

    /**
     * 
     * @param {number} min 
     */
    self.setMinError = function (min) {
        privateScope.minError = min;
    }

    /**
     * Executes PID controller based on current value and target
     * @param {THREE.Vector3} current
     * @returns {THREE.Vector3}
     */
    self.run = function (current) {
        var error = current.sub(privateScope.target);
        if (error.length() < privateScope.minError) {
            return 0;
        }
        var Pterm = error.clone().multiplyScalar(privateScope.gains.P,);
        var Dterm = error.clone().sub(privateScope.previousError).multiplyScalar(privateScope.gains.D);
        privateScope.Iterm.add(error.clone().multiplyScalar(privateScope.gains.I))
        privateScope.previousError = error;

        if (privateScope.Iterm.length() > privateScope.ItermLimit.max) {
            privateScope.Iterm.normalize().multiplyScalar(privateScope.ItermLimit.max);
        } else if (privateScope.Iterm < privateScope.ItermLimit.min) {
            privateScope.Iterm.normalize().multiplyScalar(privateScope.ItermLimit.min);
        }

        var output = Pterm.add(privateScope.Iterm).add(Dterm);
        if (output.length() < privateScope.output.minThreshold) {
            output.normalize().multiplyScalar(privateScope.output.min);
        } else if (output.length() > privateScope.output.max) {
            output.normalize().multiplyScalar(privateScope.output.max);
        }

        return output;
    };

    return self;
};

export { VectorPidController };