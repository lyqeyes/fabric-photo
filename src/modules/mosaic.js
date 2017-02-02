import Base from './base.js';
import consts from '../consts';

export default class Mosaic extends Base {
    constructor(parent) {
        super();
        this.setParent(parent);

        this.name = consts.componentNames.MOSAIC;

        this._dimensions = 12;

        this._listeners = {
            mousedown: this._onFabricMouseDown.bind(this),
            mousemove: this._onFabricMouseMove.bind(this),
            mouseup: this._onFabricMouseUp.bind(this)
        };
    }

    /**
     * @param {{dimensions: ?number}} [setting] - Mosaic width 
     */
    start(setting) {
        const canvas = this.getCanvas();

        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;

        setting = setting || {};
        this._dimensions = setting.dimensions || this._dimensions;

        canvas.forEachObject(obj => {
            obj.set({
                evented: false
            });
        });

        canvas.on({
            'mouse:down': this._listeners.mousedown
        });
    }

    end() {
        const canvas = this.getCanvas();

        canvas.defaultCursor = 'default';
        canvas.selection = true;

        canvas.forEachObject(obj => {
            obj.set({
                evented: true
            });
        });

        canvas.off('mouse:down', this._listeners.mousedown);
    }

    _onFabricMouseDown(fEvent) {
        const canvas = this.getCanvas();
        const pointer = this.pointer = canvas.getPointer(fEvent.e);
        this._mosaicGroup = new fabric.Group([], {
            left: pointer.x,
            top: pointer.y
        });
        canvas.add(this._mosaicGroup);
        canvas.on({
            'mouse:move': this._listeners.mousemove,
            'mouse:up': this._listeners.mouseup
        });
        this.getImageData = canvas.contextContainer.getImageData;
    }
    _onFabricMouseMove(fEvent) {
        const canvas = this.getCanvas();
        const pointer = canvas.getPointer(fEvent.e);
        let imageData = this.getImageData(pointer.x, pointer.y, this._dimensions, this._dimensions);
        let rgba = [0, 0, 0, 0];
        let length = imageData.data.length / 4;
        for (let i = 0; i < length; i++) {
            rgba[0] += imageData.data[i * 4];
            rgba[1] += imageData.data[i * 4 + 1];
            rgba[2] += imageData.data[i * 4 + 2];
            rgba[3] += imageData.data[i * 4 + 3];
        }
        this._mosaicGroup.add(new fabric.Rect({
            fill: `rgba(${rgba[0]/length},${rgba[1]/length} ,${rgba[2]/length},${rgba[3]/length})`,
            height: this._dimensions,
            width: this._dimensions,
            left: pointer.x - this.pointer.x,
            top: pointer.y - this.pointer.y
        }));
        canvas.renderAll();
    }

    _onFabricMouseUp() {
        const canvas = this.getCanvas();
        this._mosaicGroup = null;
        this.pointer = null;
        this.getImageData = null;
        canvas.off({
            'mouse:move': this._listeners.mousemove,
            'mouse:up': this._listeners.mouseup
        });
    }
}