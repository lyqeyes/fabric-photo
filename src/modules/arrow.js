import Base from './base';
import consts from '../consts';
import util from '../lib/util';

const MOUSE_MOVE_THRESHOLD = consts.MOUSE_MOVE_THRESHOLD;
const abs = Math.abs;

export default class Arrow extends Base {
    constructor(parent) {
        super();
        this.setParent(parent);
        this.name = consts.moduleNames.ARROW;
        this._width = 12;
        this._oColor = new fabric.Color('rgba(0, 0, 0, 0.5)');
        this._listeners = {
            mousedown: this._onFabricMouseDown.bind(this),
            mousemove: this._onFabricMouseMove.bind(this),
            mouseup: this._onFabricMouseUp.bind(this)
        };
    }

    /**
     * Start drawing arrow mode
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    start(setting) {
        const canvas = this.getCanvas();

        canvas.defaultCursor = 'crosshair';
        canvas.selection = false;

        canvas.forEachObject(obj => {
            obj.set({
                evented: false
            });
        });
        this.setBrush(setting);
        canvas.on({
            'mouse:down': this._listeners.mousedown
        });

    }

    /**
     * Set brush
     * @param {{width: ?number, color: ?string}} [setting] - Brush width & color
     */
    setBrush(setting) {
        const brush = this.getCanvas().freeDrawingBrush;

        setting = setting || {};
        this._width = setting.width || this._width;

        if (setting.color) {
            this._oColor = new fabric.Color(setting.color);
        }
        brush.width = this._width;
        brush.color = this._oColor.toRgba();
    }

    /**
     * End drawing line mode
     */
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

    /**
     * create an arrow on head
     * @param [x1,y1,x2,y2]
     */
    _createArrowHead(points) {
        var headLength = 15,

            x1 = points[0],
            y1 = points[1],
            x2 = points[2],
            y2 = points[3],

            dx = x2 - x1,
            dy = y2 - y1,

            angle = Math.atan2(dy, dx);

        angle *= 180 / Math.PI;
        angle += 90;

        var triangle = new fabric.Triangle({
            angle: angle,
            fill: this._oColor.toRgba(),
            top: y2,
            left: x2,
            height: headLength,
            width: headLength,
            originX: 'center',
            originY: 'center'
        });
        return triangle;
    }

    /**
     * Mousedown event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseDown(fEvent) {
        const canvas = this.getCanvas();
        if(fEvent.target && fEvent.target.customType === 'arrow'){
            console.log(fEvent.target);
            canvas.trigger('object:selected', {target: fEvent.target});
            return;
        }
        const pointer = this.startPointer = canvas.getPointer(fEvent.e);
        //this.drawArrow(pointer,pointer);
        let group = this.group = new fabric.Group([/*this.line, this.arrow, this.circle*/], {
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center'
        });
        this.group.set(consts.fObjectOptions.SELECTION_STYLE);
        this.group.set('selectable', true);
        group.customType = 'arrow';
        canvas.add(group);
        canvas.renderAll();
        canvas.on({
            'mouse:move': this._listeners.mousemove,
            'mouse:up': this._listeners.mouseup
        });
    }

    drawArrow(startPointer,endPointer){
        const points = [startPointer.x, startPointer.y, endPointer.x, endPointer.y];
        const line = this.line = new fabric.Line(points, {
            stroke: this._oColor.toRgba(),
            strokeWidth: this._width,
            padding: 5,
            originX: 'center',
            originY: 'center'
        });

        let centerX = (line.x1 + line.x2) / 2,
            centerY = (line.y1 + line.y2) / 2;
        let deltaX = line.left - centerX,
            deltaY = line.top - centerY;

        const arrow = this.arrow = new fabric.Triangle({
            left: line.get('x1') + deltaX,
            top: line.get('y1') + deltaY,
            originX: 'center',
            originY: 'center',
            pointType: 'arrow_start',
            angle: startPointer.x===endPointer.x&&startPointer.y===endPointer.y?-45:
            this.calcArrowAngle(startPointer.x, startPointer.y, endPointer.x, endPointer.y)-90,
            width: this._width*10,
            height: this._width*10,
            fill: this._oColor.toRgba()
        });
        const circle = this.circle = new fabric.Circle({
            left: line.get('x2') + deltaX,
            top: line.get('y2') + deltaY,
            radius: this._width*2,
            stroke: this._oColor.toRgba(),
            strokeWidth: this._width,
            originX: 'center',
            originY: 'center',
            pointType: 'arrow_end',
            fill: this._oColor.toRgba()
        });
        line.customType = arrow.customType = circle.customType = 'arrow';
    }
    
    /**
     * Mousemove event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseMove(fEvent) {
        const canvas = this.getCanvas();
        const pointer = canvas.getPointer(fEvent.e);
        const x = pointer.x;
        const y = pointer.y;
        if (abs(x - this.startPointer.x) + abs(y - this.startPointer.y) > 5) {
            this.group.remove(this.line,this.arrow,this.circle);
            this.drawArrow(pointer,this.startPointer);
            this.group.addWithUpdate(this.arrow);
            this.group.addWithUpdate(this.line);
            this.group.addWithUpdate(this.circle);
            canvas.renderAll();
        }
    }

    /**
     * Mouseup event handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event object
     * @private
     */
    _onFabricMouseUp() {
        const canvas = this.getCanvas();

        this.line = null;

        canvas.off({
            'mouse:move': this._listeners.mousemove,
            'mouse:up': this._listeners.mouseup
        });
    }


    calcArrowAngle(x1, y1, x2, y2) {
        var angle = 0,
            x, y;
        x = (x2 - x1);
        y = (y2 - y1);
        if (x === 0) {
            angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
        }
        else if (y === 0) {
            angle = (x > 0) ? 0 : Math.PI;
        }
        else {
            angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
        }
        return (angle * 180 / Math.PI);
    }
}
