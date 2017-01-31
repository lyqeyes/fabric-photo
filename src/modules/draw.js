import Base from './base.js';
import consts from '../consts';

/**
 * FreeDrawing
 * @class FreeDrawing
 * @param {Component} parent - parent Module
 * @extends {Base}
 * @ignore
 */
export default class FreeDrawing extends Base {
    constructor(parent) {
        super();
        this.setParent(parent);

        /**
         * Component name
         * @type {string}
         */
        this.name = consts.moduleNames.FREE_DRAWING;

        /**
         * Brush width
         * @type {number}
         */
        this.width = 12;

        /**
         * fabric.Color instance for brush color
         * @type {fabric.Color}
         */
        this.oColor = new fabric.Color('rgba(0, 0, 0, 0.5)');
    }

    /**
     * Start free drawing mode
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    start(setting) {
        const canvas = this.getCanvas();
        canvas.isDrawingMode = true;
        this.setBrush(setting);
    }

    /**
     * Set brush
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    setBrush(setting) {
        const brush = this.getCanvas().freeDrawingBrush;
        setting = setting || {};
        this.width = setting.width || this.width;
        if (setting.color) {
            this.oColor = new fabric.Color(setting.color);
        }
        brush.width = this.width;
        brush.color = this.oColor.toRgba();
    }

    /**
     * End free drawing mode
     */
    end() {
        const canvas = this.getCanvas();
        canvas.isDrawingMode = false;
    }
}