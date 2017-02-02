import $ from 'jquery';
import fabric from 'fabric';


import imageLayout from './image-layout.js';
import module from './module';
import commandFactory from './command';
import consts from './consts';
import util from './lib/util';
import CustomEvents from './lib/custom-event';

const events = consts.eventNames;
const modules = consts.moduleNames;
const commands = consts.commandNames;
const {
    states,
    keyCodes,
    fObjectOptions
} = consts;
const {
    isUndefined,
    forEach,
    hasStamp
} = util;

let defultOpt = {
    renderTo: '#container',
    thumb: ''
};
let DomURL = window.URL || window.webkitURL || window;

class FabricPhoto {

    constructor(element, option) {
        option = option || {};
        this._module = new module();
        this._canvas = null;
        this._state = states.NORMAL;
        this._handlers = {
            keydown: this._onKeyDown.bind(this),
            mousedown: this._onMouseDown.bind(this),
            addedObject: this._onAddedObject.bind(this),
            removedObject: this._onRemovedObject.bind(this),
            selectedObject: this._onSelectedObject.bind(this),
            movingObject: this._onMovingObject.bind(this),
            scalingObject: this._onScalingObject.bind(this),
            createdPath: this._onCreatedPath.bind(this)
        };

        this._setCanvas(element, option.cssMaxWidth, option.cssMaxHeight);
        this._attachModuleEvents();
        this._attachCanvasEvents();
        this._attachDomEvents();


        if (option.selectionStyle) {
            this._setSelectionStyle(option.selectionStyle);
        }
    }

    _setSelectionStyle(styles) {
        Object.assign(fObjectOptions.SELECTION_STYLE, styles);
    }

    _attachModuleEvents() {
        const {
            PUSH_UNDO_STACK,
            PUSH_REDO_STACK,
            EMPTY_UNDO_STACK,
            EMPTY_REDO_STACK
        } = events;

        /**
         * @event ImageEditor#pushUndoStack
         */
        this._module.on(PUSH_UNDO_STACK, this.fire.bind(this, PUSH_UNDO_STACK));
        /**
         * @event ImageEditor#pushRedoStack
         */
        this._module.on(PUSH_REDO_STACK, this.fire.bind(this, PUSH_REDO_STACK));
        /**
         * @event ImageEditor#emptyUndoStack
         */
        this._module.on(EMPTY_UNDO_STACK, this.fire.bind(this, EMPTY_UNDO_STACK));
        /**
         * @event ImageEditor#emptyRedoStack
         */
        this._module.on(EMPTY_REDO_STACK, this.fire.bind(this, EMPTY_REDO_STACK));
    }
    _attachCanvasEvents() {
        this._canvas.on({
            'mouse:down': this._handlers.mousedown,
            'object:added': this._handlers.addedObject,
            'object:removed': this._handlers.removedObject,
            'object:moving': this._handlers.movingObject,
            'object:scaling': this._handlers.scalingObject,
            'object:selected': this._handlers.selectedObject,
            'path:created': this._handlers.createdPath
        });
    }
    _attachDomEvents() {
        fabric.util.addListener(document, 'keydown', this._handlers.keydown);
    }
    _detachDomEvents() {
        fabric.util.removeListener(document, 'keydown', this._handlers.keydown);
    }
    _onKeyDown(e) {
        if ((e.ctrlKey || e.metaKey) && e.keyCode === keyCodes.Z) {
            this.undo();
        }

        if ((e.ctrlKey || e.metaKey) && e.keyCode === keyCodes.Y) {
            this.redo();
        }

        if ((e.keyCode === keyCodes.BACKSPACE || e.keyCode === keyCodes.DEL) &&
            this._canvas.getActiveObject()) {
            e.preventDefault();
            this.removeActiveObject();
        }
    }
    _onMouseDown(fEvent) {
            const originPointer = this._canvas.getPointer(fEvent.e);

            this.fire(events.MOUSE_DOWN, {
                e: fEvent.e,
                originPointer
            });
        }
        /**
         * "object:added" canvas event handler
         * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
         * @private
         */
    _onAddedObject(fEvent) {
            const obj = fEvent.target;

            if (obj.isType('cropzone') || obj.isType('text')) {
                return;
            }

            if (!hasStamp(obj)) {
                const command = commandFactory.create(commands.ADD_OBJECT, obj);
                this._module.pushUndoStack(command);
                this._module.clearRedoStack();
            }

            /**
             * @event ImageEditor#addObject
             * @param {fabric.Object} obj - http://fabricjs.com/docs/fabric.Object.html
             * @example
             * imageEditor.on('addObject', function(obj) {
             *     console.log(obj);
             * });
             */
            this.fire(events.ADD_OBJECT, obj);
        }
        /**
         * "object:removed" canvas event handler
         * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
         * @private
         */
    _onRemovedObject(fEvent) {
            /**
             * @event ImageEditor#removeObject
             * @param {fabric.Object} obj - http://fabricjs.com/docs/fabric.Object.html
             * @example
             * imageEditor.on('removeObject', function(obj) {
             *     console.log(obj);
             * });
             */
            this.fire(events.REMOVE_OBJECT, fEvent.target);
        }
        /**
         * "object:selected" canvas event handler
         * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
         * @private
         */
    _onSelectedObject(fEvent) {
            /**
             * @event ImageEditor#selectObject
             * @param {fabric.Object} obj - http://fabricjs.com/docs/fabric.Object.html
             * @example
             * imageEditor.on('selectObject', function(obj) {
             *     console.log(obj);
             *     console.log(obj.type);
             * });
             */
            this.fire(events.SELECT_OBJECT, fEvent.target);
        }
        /**
         * "object:moving" canvas event handler
         * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
         * @private
         */
    _onMovingObject(fEvent) {
        /**
         * @event ImageEditor#adjustObject
         * @param {fabric.Object} obj - http://fabricjs.com/docs/fabric.Object.html
         * @param {string} Action type (move / scale)
         * @example
         * imageEditor.on('adjustObject', function(obj, type) {
         *     console.log(obj);
         *     console.log(type);
         * });
         */
        this.fire(events.ADJUST_OBJECT, fEvent.target, 'move');
    }

    /**
     * "object:scaling" canvas event handler
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
     * @private
     */
    _onScalingObject(fEvent) {
        /**
         * @ignore
         * @event ImageEditor#adjustObject
         * @param {fabric.Object} obj - http://fabricjs.com/docs/fabric.Object.html
         * @param {string} Action type (move / scale)
         * @example
         * imageEditor.on('adjustObject', function(obj, type) {
         *     console.log(obj);
         *     console.log(type);
         * });
         */
        this.fire(events.ADJUST_OBJECT, fEvent.target, 'move');
    }


    /**
     * EventListener - "path:created"
     *  - Events:: "object:added" -> "path:created"
     * @param {{path: fabric.Path}} obj - Path object
     * @private
     */
    _onCreatedPath(obj) {
            obj.path.set(consts.fObjectOptions.SELECTION_STYLE);
        }
        /**
         * onSelectClear handler in fabric canvas
         * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
         * @private
         */
    _onFabricSelectClear(fEvent) {
        const textComp = this._getModule(modules.TEXT);
        const obj = textComp.getSelectedObj();

        textComp.isPrevEditing = true;

        textComp.setSelectedInfo(fEvent.target, false);

        if (obj.text === '') {
            obj.remove();
        }
        else if (!hasStamp(obj)) {
            const command = commandFactory.create(commands.ADD_OBJECT, obj);
            this._module.pushUndoStack(command);
            this._module.clearRedoStack();
        }
    }

    /**
     * onSelect handler in fabric canvas
     * @param {{target: fabric.Object, e: MouseEvent}} fEvent - Fabric event
     * @private
     */
    _onFabricSelect(fEvent) {
        const textComp = this._getModule(modules.TEXT);
        const obj = textComp.getSelectedObj();

        textComp.isPrevEditing = true;

        if (obj.text === '') {
            obj.remove();
        }
        else if (!hasStamp(obj) && textComp.isSelected()) {
            const command = commandFactory.create(commands.ADD_OBJECT, obj);
            this._module.pushUndoStack(command);
            this._module.clearRedoStack();
        }

        textComp.setSelectedInfo(fEvent.target, true);
    }

    /**
     * Set canvas element
     * @param {string|jQuery|HTMLElement} element - Wrapper or canvas element or selector
     * @param {number} cssMaxWidth - Canvas css max width
     * @param {number} cssMaxHeight - Canvas css max height
     * @private
     */
    _setCanvas(element, cssMaxWidth, cssMaxHeight) {
        const mainModule = this._getMainModule();
        mainModule.setCanvasElement(element);
        mainModule.setCssMaxDimension({
            width: cssMaxWidth,
            height: cssMaxHeight
        });
        this._canvas = mainModule.getCanvas();
    }

    /**
     * Returns main module
     * @returns {Module} Main module
     * @private
     */
    _getMainModule() {
        return this._getModule(modules.MAIN);
    }

    /**
     * Get module
     * @param {string} name - Module name
     * @returns {Module}
     * @private
     */
    _getModule(name) {
        return this._module.getModule(name);
    }

    /**
     * Get current state
     * @returns {string}
     * @example
     * // Image editor states
     * //
     * //    NORMAL: 'NORMAL'
     * //    CROP: 'CROP'
     * //    FREE_DRAWING: 'FREE_DRAWING'
     * //    TEXT: 'TEXT'
     * //
     * if (imageEditor.getCurrentState() === 'FREE_DRAWING') {
     *     imageEditor.endFreeDrawing();
     * }
     */
    getCurrentState() {
        return this._state;
    }

    /**
     * Clear all objects
     * @example
     * imageEditor.clearObjects();
     */
    clearObjects() {
        const command = commandFactory.create(commands.CLEAR_OBJECTS);
        const callback = this.fire.bind(this, events.CLEAR_OBJECTS);

        /**
         * @event ImageEditor#clearObjects
         */
        command.setExecuteCallback(callback);
        this.execute(command);
    }

    /**
     * End current action & Deactivate
     * @example
     * imageEditor.startFreeDrawing();
     * imageEidtor.endAll(); // === imageEidtor.endFreeDrawing();
     *
     * imageEditor.startCropping();
     * imageEditor.endAll(); // === imageEidtor.endCropping();
     */
    endAll() {
        this.endTextMode();
        this.endFreeDrawing();
        //this.endLineDrawing();
        this.endMosaicDrawing();
        //this.endCropping();
        //this.endDrawingShapeMode();
        this.deactivateAll();
        this._state = states.NORMAL;
    }

    /**
     * Deactivate all objects
     * @example
     * imageEditor.deactivateAll();
     */
    deactivateAll() {
        this._canvas.deactivateAll();
        this._canvas.renderAll();
    }

    /**
     * Invoke command
     * @param {Command} command - Command
     * @ignore
     */
    execute(command) {
        this.endAll();
        this._module.invoke(command);
    }

    /**
     * Undo
     * @example
     * imageEditor.undo();
     */
    undo() {
        this.endAll();
        this._module.undo();
    }

    /**
     * Redo
     * @example
     * imageEditor.redo();
     */
    redo() {
        this.endAll();
        this._module.redo();
    }

    /**
     * Load image from file
     * @param {File} imgFile - Image file
     * @param {string} [imageName] - imageName
     * @example
     * imageEditor.loadImageFromFile(file);
     */
    loadImageFromFile(imgFile, imageName) {
        if (!imgFile) {
            return;
        }

        this.loadImageFromURL(
            DomURL.createObjectURL(imgFile),
            imageName || imgFile.name
        );
    }

    /**
     * Load image from url
     * @param {string} url - File url
     * @param {string} imageName - imageName
     * @example
     * imageEditor.loadImageFromURL('http://url/testImage.png', 'lena')
     */
    loadImageFromURL(url, imageName) {
        if (!imageName || !url) {
            return;
        }

        const callback = this._callbackAfterImageLoading.bind(this);
        const command = commandFactory.create(commands.LOAD_IMAGE, imageName, url);
        command.setExecuteCallback(callback)
            .setUndoCallback(oImage => {
                if (oImage) {
                    callback(oImage);
                }
                else {
                    /**
                     * @event ImageEditor#clearImage
                     */
                    this.fire(events.CLEAR_IMAGE);
                }
            });
        this.execute(command);
    }


    /**
     * Callback after image loading
     * @param {?fabric.Image} oImage - Image instance
     * @private
     */
    _callbackAfterImageLoading(oImage) {
        const mainModule = this._getMainModule();
        const canvasElement = mainModule.getCanvasElement();
        const {
            width,
            height
        } = canvasElement.getBoundingClientRect();

        /**
         * @event ImageEditor#loadImage
         * @param {object} dimension
         *  @param {number} dimension.originalWidth - original image width
         *  @param {number} dimension.originalHeight - original image height
         *  @param {number} dimension.currentWidth - current width (css)
         *  @param {number} dimension.current - current height (css)
         * @example
         * imageEditor.on('loadImage', function(dimension) {
         *     console.log(dimension.originalWidth);
         *     console.log(dimension.originalHeight);
         *     console.log(dimension.currentWidth);
         *     console.log(dimension.currentHeight);
         * });
         */
        this.fire(events.LOAD_IMAGE, {
            originalWidth: oImage.width,
            originalHeight: oImage.height,
            currentWidth: width,
            currentHeight: height
        });
    }

    /**
     * Add image object on canvas
     * @param {string} imgUrl - Image url to make object
     * @example
     * imageEditor.addImageObject('path/fileName.jpg');
     */
    addImageObject(imgUrl) {
        if (!imgUrl) {
            return;
        }

        fabric.Image.fromURL(imgUrl,
            this._callbackAfterLoadingImageObject.bind(this), {
                crossOrigin: 'Anonymous'
            }
        );
    }

    /**
     * Callback function after loading image
     * @param {fabric.Image} obj - Fabric image object
     * @private
     */
    _callbackAfterLoadingImageObject(obj) {
        const mainModule = this._getMainModule();
        const centerPos = mainModule.getCanvasImage().getCenterPoint();

        obj.set(consts.fObjectOptions.SELECTION_STYLE);
        obj.set({
            left: centerPos.x,
            top: centerPos.y,
            crossOrigin: 'anonymous'
        });

        this._canvas.add(obj).setActiveObject(obj);
    }

    /**
     * Start cropping
     * @example
     * imageEditor.startCropping();
     */
    startCropping() {
        if (this.getCurrentState() === states.CROP) {
            return;
        }

        this.endAll();
        this._state = states.CROP;
        const cropper = this._getModule(modules.CROPPER);
        cropper.start();
        /**
         * @event ImageEditor#startCropping
         */
        this.fire(events.START_CROPPING);
    }

    /**
     * Apply cropping
     * @param {boolean} [isApplying] - Whether the cropping is applied or canceled
     * @example
     * imageEditor.startCropping();
     * imageEditor.endCropping(false); // cancel cropping
     *
     * imageEditor.startCropping();
     * imageEditor.endCropping(true); // apply cropping
     */
    endCropping(isApplying) {
        if (this.getCurrentState() !== states.CROP) {
            return;
        }

        const cropper = this._getModule(modules.CROPPER);
        this._state = states.NORMAL;
        const data = cropper.end(isApplying);

        this.once('loadImage', () => {
            /**
             * @event ImageEditor#endCropping
             */
            this.fire(events.END_CROPPING);
        });

        if (data) {
            this.loadImageFromURL(data.url, data.imageName);
        }
    }

    /**
     * @param {string} type - 'rotate' or 'setAngle'
     * @param {number} angle - angle value (degree)
     * @private
     */
    _rotate(type, angle) {
        const callback = this.fire.bind(this, events.ROTATE_IMAGE);
        const command = commandFactory.create(commands.ROTATE_IMAGE, type, angle);

        /**
         * @event ImageEditor#rotateImage
         * @param {number} currentAngle - image.angle
         * @example
         * imageEditor.on('rotateImage', function(angle) {
         *     console.log('angle: ', angle);
         * });
         */
        command.setExecuteCallback(callback)
            .setUndoCallback(callback);
        this.execute(command);
    }

    /**
     * Rotate image
     * @param {number} angle - Additional angle to rotate image
     * @example
     * imageEditor.setAngle(10); // angle = 10
     * imageEditor.rotate(10); // angle = 20
     * imageEidtor.setAngle(5); // angle = 5
     * imageEidtor.rotate(-95); // angle = -90
     */
    rotate(angle) {
        this._rotate('rotate', angle);
    }

    /**
     * Set angle
     * @param {number} angle - Angle of image
     * @example
     * imageEditor.setAngle(10); // angle = 10
     * imageEditor.rotate(10); // angle = 20
     * imageEidtor.setAngle(5); // angle = 5
     * imageEidtor.rotate(50); // angle = 55
     * imageEidtor.setAngle(-40); // angle = -40
     */
    setAngle(angle) {
        this._rotate('setAngle', angle);
    }

    /**
     * Start free-drawing mode
     * @param {{width: number, color: string}} [setting] - Brush width & color
     * @example
     * imageEditor.startFreeDrawing();
     * imageEditor.endFreeDrawing();
     * imageEidtor.startFreeDrawing({
     *     width: 12,
     *     color: 'rgba(0, 0, 0, 0.5)'
     * });
     */
    startFreeDrawing(setting) {
        if (this.getCurrentState() === states.FREE_DRAWING) {
            return;
        }
        this.endAll();
        this._getModule(modules.FREE_DRAWING).start(setting);
        this._state = states.FREE_DRAWING;

        /**
         * @event ImageEditor#startFreeDrawing
         */
        this.fire(events.START_FREE_DRAWING);
    }

    /**
     * Set drawing brush
     * @param {{width: number, color: string}} setting - Brush width & color
     * @example
     * imageEditor.startFreeDrawing();
     * imageEditor.setBrush({
     *     width: 12,
     *     color: 'rgba(0, 0, 0, 0.5)'
     * });
     * imageEditor.setBrush({
     *     width: 8,
     *     color: 'FFFFFF'
     * });
     */
    setBrush(setting) {
        const state = this._state;
        let compName;

        switch (state) {
            case states.LINE:
                compName = modules.LINE;
                break;
            default:
                compName = modules.FREE_DRAWING;
        }

        this._getModule(compName).setBrush(setting);
    }

    /**
     * End free-drawing mode
     * @example
     * imageEditor.startFreeDrawing();
     * imageEditor.endFreeDrawing();
     */
    endFreeDrawing() {
        if (this.getCurrentState() !== states.FREE_DRAWING) {
            return;
        }
        this._getModule(modules.FREE_DRAWING).end();
        this._state = states.NORMAL;

        /**
         * @event ImageEditor#endFreeDrawing
         */
        this.fire(events.END_FREE_DRAWING);
    }

    /**
     * Start line-drawing mode
     * @param {{width: number, color: string}} [setting] - Brush width & color
     * @example
     * imageEditor.startLineDrawing();
     * imageEditor.endLineDrawing();
     * imageEidtor.startLineDrawing({
     *     width: 12,
     *     color: 'rgba(0, 0, 0, 0.5)'
     * });
     */
    startLineDrawing(setting) {
        if (this.getCurrentState() === states.LINE) {
            return;
        }

        this.endAll();
        this._getModule(modules.LINE).start(setting);
        this._state = states.LINE;

        /**
         * @event ImageEditor#startLineDrawing
         */
        this.fire(events.START_LINE_DRAWING);
    }

    /**
     * End line-drawing mode
     * @example
     * imageEditor.startLineDrawing();
     * imageEditor.endLineDrawing();
     */
    endLineDrawing() {
        if (this.getCurrentState() !== states.LINE) {
            return;
        }
        this._getModule(modules.LINE).end();
        this._state = states.NORMAL;

        /**
         * @event ImageEditor#endLineDrawing
         */
        this.fire(events.END_LINE_DRAWING);
    }


    /**
     * Start mosaic mode
     * @param {{dimensions: number}} [setting] - dimensions
     * @example
     * imageEditor.startMosaicDrawing();
     * imageEditor.endMosaicDrawing();
     * imageEidtor.startLineDrawing({
     *     dimensions: 12,
     * });
     */
    startMosaicDrawing(setting) {
        this.endAll();
        this._getModule(modules.MOSAIC).start(setting);
        this._state = states.MOSAIC;

        this.fire(events.START_MOSAIC_DRAWING);
    }

    /**
     * End endMosaic mode
     * @example
     * imageEditor.startMosaicDrawing();
     * imageEditor.endMosaicDrawing();
     */
    endMosaicDrawing() {
            if (this.getCurrentState() !== states.LINE) {
                return;
            }
            this._getModule(modules.LINE).end();
            this._state = states.NORMAL;

            this.fire(events.END_MOSAIC_DRAWING);
        }
        /**
         * Start to draw shape on canvas (bind event on canvas)
         * @example
         * imageEditor.startDrawingShapeMode();
         */
    startDrawingShapeMode() {
        if (this.getCurrentState() !== states.SHAPE) {
            this._state = states.SHAPE;
            this._getModule(modules.SHAPE).startDrawingMode();
        }
    }

    /**
     * Set states of current drawing shape
     * @param {string} type - Shape type (ex: 'rect', 'circle', 'triangle')
     * @param {object} [options] - Shape options
     *      @param {string} [options.fill] - Shape foreground color (ex: '#fff', 'transparent')
     *      @param {string} [options.stoke] - Shape outline color
     *      @param {number} [options.strokeWidth] - Shape outline width
     *      @param {number} [options.width] - Width value (When type option is 'rect', this options can use)
     *      @param {number} [options.height] - Height value (When type option is 'rect', this options can use)
     *      @param {number} [options.rx] - Radius x value (When type option is 'circle', this options can use)
     *      @param {number} [options.ry] - Radius y value (When type option is 'circle', this options can use)
     *      @param {number} [options.isRegular] - Whether resizing shape has 1:1 ratio or not
     * @example
     * imageEditor.setDrawingShape('rect', {
     *     fill: 'red',
     *     width: 100,
     *     height: 200
     * });
     * imageEditor.setDrawingShape('circle', {
     *     fill: 'transparent',
     *     stroke: 'blue',
     *     strokeWidth: 3,
     *     rx: 10,
     *     ry: 100
     * });
     * imageEditor.setDrawingShape('triangle', { // When resizing, the shape keep the 1:1 ratio
     *     width: 1,
     *     height: 1,
     *     isRegular: true
     * });
     * imageEditor.setDrawingShape('circle', { // When resizing, the shape keep the 1:1 ratio
     *     rx: 10,
     *     ry: 10,
     *     isRegular: true
     * });
     */
    setDrawingShape(type, options) {
        this._getModule(modules.SHAPE).setStates(type, options);
    }

    /**
     * Add shape
     * @param {string} type - Shape type (ex: 'rect', 'circle', 'triangle')
     * @param {object} options - Shape options
     *      @param {string} [options.fill] - Shape foreground color (ex: '#fff', 'transparent')
     *      @param {string} [options.stroke] - Shape outline color
     *      @param {number} [options.strokeWidth] - Shape outline width
     *      @param {number} [options.width] - Width value (When type option is 'rect', this options can use)
     *      @param {number} [options.height] - Height value (When type option is 'rect', this options can use)
     *      @param {number} [options.rx] - Radius x value (When type option is 'circle', this options can use)
     *      @param {number} [options.ry] - Radius y value (When type option is 'circle', this options can use)
     *      @param {number} [options.left] - Shape x position
     *      @param {number} [options.top] - Shape y position
     *      @param {number} [options.isRegular] - Whether resizing shape has 1:1 ratio or not
     * @example
     * imageEditor.addShape('rect', {
     *     fill: 'red',
     *     stroke: 'blue',
     *     strokeWidth: 3,
     *     width: 100,
     *     height: 200,
     *     left: 10,
     *     top: 10,
     *     isRegular: true
     * });
     * imageEditor.addShape('circle', {
     *     fill: 'red',
     *     stroke: 'blue',
     *     strokeWidth: 3,
     *     rx: 10,
     *     ry: 100,
     *     isRegular: false
     * });
     */
    addShape(type, options) {
        options = options || {};

        this._setPositions(options);
        this._getModule(modules.SHAPE).add(type, options);
    }

    /**
     * Change shape
     * @param {object} options - Shape options
     *      @param {string} [options.fill] - Shape foreground color (ex: '#fff', 'transparent')
     *      @param {string} [options.stroke] - Shape outline color
     *      @param {number} [options.strokeWidth] - Shape outline width
     *      @param {number} [options.width] - Width value (When type option is 'rect', this options can use)
     *      @param {number} [options.height] - Height value (When type option is 'rect', this options can use)
     *      @param {number} [options.rx] - Radius x value (When type option is 'circle', this options can use)
     *      @param {number} [options.ry] - Radius y value (When type option is 'circle', this options can use)
     *      @param {number} [options.isRegular] - Whether resizing shape has 1:1 ratio or not
     * @example
     * // call after selecting shape object on canvas
     * imageEditor.changeShape({ // change rectagle or triangle
     *     fill: 'red',
     *     stroke: 'blue',
     *     strokeWidth: 3,
     *     width: 100,
     *     height: 200
     * });
     * imageEditor.changeShape({ // change circle
     *     fill: 'red',
     *     stroke: 'blue',
     *     strokeWidth: 3,
     *     rx: 10,
     *     ry: 100
     * });
     */
    changeShape(options) {
        const activeObj = this._canvas.getActiveObject();
        const shapeModule = this._getModule(modules.SHAPE);

        if (!activeObj) {
            return;
        }

        shapeModule.change(activeObj, options);
    }

    /**
     * End to draw shape on canvas (unbind event on canvas)
     * @example
     * imageEditor.startDrawingShapeMode();
     * imageEditor.endDrawingShapeMode();
     */
    endDrawingShapeMode() {
        if (this.getCurrentState() === states.SHAPE) {
            this._getModule(modules.SHAPE).endDrawingMode();
            this._state = states.NORMAL;
        }
    }

    /**
     * Start text input mode
     * @example
     * imageEditor.endTextMode();
     * imageEditor.startTextMode();
     */
    startTextMode() {
        if (this.getCurrentState() !== states.TEXT) {
            this._state = states.TEXT;

            this._getModule(modules.TEXT).start({
                mousedown: this._onFabricMouseDown.bind(this),
                select: this._onFabricSelect.bind(this),
                selectClear: this._onFabricSelectClear.bind(this),
                dbclick: this._onDBClick.bind(this),
                remove: this._handlers.removedObject
            });
        }
    }

    /**
     * Add text on image
     * @param {string} text - Initial input text
     * @param {object} [options] Options for generating text
     *     @param {object} [options.styles] Initial styles
     *         @param {string} [options.styles.fill] Color
     *         @param {string} [options.styles.fontFamily] Font type for text
     *         @param {number} [options.styles.fontSize] Size
     *         @param {string} [options.styles.fontStyle] Type of inclination (normal / italic)
     *         @param {string} [options.styles.fontWeight] Type of thicker or thinner looking (normal / bold)
     *         @param {string} [options.styles.textAlign] Type of text align (left / center / right)
     *         @param {string} [options.styles.textDecoraiton] Type of line (underline / line-throgh / overline)
     *     @param {{x: number, y: number}} [options.position] - Initial position
     * @example
     * imageEditor.addText();
     * imageEditor.addText('init text', {
     *     styles: {
     *     fill: '#000',
     *         fontSize: '20',
     *         fontWeight: 'bold'
     *     },
     *     position: {
     *         x: 10,
     *         y: 10
     *     }
     * });
     */
    addText(text, options) {
        if (this.getCurrentState() !== states.TEXT) {
            this._state = states.TEXT;
        }

        this._getModule(modules.TEXT).add(text || '', options || {});
    }

    /**
     * Change contents of selected text object on image
     * @param {string} text - Changing text
     * @example
     * imageEditor.changeText('change text');
     */
    changeText(text) {
        const activeObj = this._canvas.getActiveObject();

        if (this.getCurrentState() !== states.TEXT ||
            !activeObj) {
            return;
        }

        this._getModule(modules.TEXT).change(activeObj, text);
    }

    /**
     * Set style
     * @param {object} styleObj - Initial styles
     *     @param {string} [styleObj.fill] Color
     *     @param {string} [styleObj.fontFamily] Font type for text
     *     @param {number} [styleObj.fontSize] Size
     *     @param {string} [styleObj.fontStyle] Type of inclination (normal / italic)
     *     @param {string} [styleObj.fontWeight] Type of thicker or thinner looking (normal / bold)
     *     @param {string} [styleObj.textAlign] Type of text align (left / center / right)
     *     @param {string} [styleObj.textDecoraiton] Type of line (underline / line-throgh / overline)
     * @example
     * imageEditor.changeTextStyle({
     *     fontStyle: 'italic'
     * });
     */
    changeTextStyle(styleObj) {
        const activeObj = this._canvas.getActiveObject();

        if (this.getCurrentState() !== states.TEXT ||
            !activeObj) {
            return;
        }

        this._getModule(modules.TEXT).setStyle(activeObj, styleObj);
    }

    /**
     * End text input mode
     * @example
     * imageEditor.startTextMode();
     * imageEditor.endTextMode();
     */
    endTextMode() {
        if (this.getCurrentState() !== states.TEXT) {
            return;
        }

        this._state = states.NORMAL;

        this._getModule(modules.TEXT).end();
    }

    /**
     * Double click event handler
     * @private
     */
    _onDBClick() {
        /**
         * @event ImageEditor#editText
         * @example
         * imageEditor.on('editText', function(obj) {
         *     console.log('text object: ' + obj);
         * });
         */
        this.fire(events.EDIT_TEXT);
    }

    /**
     * Mousedown event handler
     * @param {fabric.Event} event - Current mousedown event object
     * @private
     */
    _onFabricMouseDown(event) { // eslint-disable-line
        const obj = event.target;
        const e = event.e || {};
        const originPointer = this._canvas.getPointer(e);
        const textComp = this._getModule(modules.TEXT);

        if (obj && !obj.isType('text')) {
            return;
        }

        if (textComp.isPrevEditing) {
            textComp.isPrevEditing = false;

            return;
        }

        /**
         * @event ImageEditor#activateText
         * @param {object} options
         *     @param {boolean} options.type - Type of text object (new / select)
         *     @param {string} options.text - Current text
         *     @param {object} options.styles - Current styles
         *         @param {string} options.styles.fill - Color
         *         @param {string} options.styles.fontFamily - Font type for text
         *         @param {number} options.styles.fontSize - Size
         *         @param {string} options.styles.fontStyle - Type of inclination (normal / italic)
         *         @param {string} options.styles.fontWeight - Type of thicker or thinner looking (normal / bold)
         *         @param {string} options.styles.textAlign - Type of text align (left / center / right)
         *         @param {string} options.styles.textDecoraiton - Type of line (underline / line-throgh / overline)
         *     @param {{x: number, y: number}} options.originPosition - Current position on origin canvas
         *     @param {{x: number, y: number}} options.clientPosition - Current position on client area
         * @example
         * imageEditor.on('activateText', function(obj) {
         *     console.log('text object type: ' + obj.type);
         *     console.log('text contents: ' + obj.text);
         *     console.log('text styles: ' + obj.styles);
         *     console.log('text position on canvas: ' + obj.originPosition);
         *     console.log('text position on brwoser: ' + obj.clientPosition);
         * });
         */
        this.fire(events.ACTIVATE_TEXT, {
            type: obj ? 'select' : 'new',
            text: obj ? obj.text : '',
            styles: obj ? {
                fill: obj.fill,
                fontFamily: obj.fontFamily,
                fontSize: obj.fontSize,
                fontStyle: obj.fontStyle,
                textAlign: obj.textAlign,
                textDecoration: obj.textDecoration
            } : {},
            originPosition: {
                x: originPointer.x,
                y: originPointer.y
            },
            clientPosition: {
                x: e.clientX || 0,
                y: e.clientY || 0
            }
        });
    }

    /**
     * Remove active object or group
     * @example
     * imageEditor.removeActiveObject();
     */
    removeActiveObject() {
        const canvas = this._canvas;
        const target = canvas.getActiveObject() || canvas.getActiveGroup();
        const command = commandFactory.create(commands.REMOVE_OBJECT, target);
        this.execute(command);
    }

    setZoom(rate) {
        rate = rate || 1;
        const command = commandFactory.create(commands.ZOOM, rate);
        this.execute(command);
    }

    /**
     * Get data url
     * @param {string} type - A DOMString indicating the image format. The default type is image/png.
     * @returns {string} A DOMString containing the requested data URI
     * @example
     * imgEl.src = imageEditor.toDataURL();
     */
    toDataURL(type) {
        return this._getMainModule().toDataURL(type);
    }

    /**
     * Get image name
     * @returns {string} image name
     * @example
     * console.log(imageEditor.getImageName());
     */
    getImageName() {
        return this._getMainModule().getImageName();
    }

    /**
     * Clear undoStack
     * @example
     * imageEditor.clearUndoStack();
     */
    clearUndoStack() {
        this._module.clearUndoStack();
    }

    /**
     * Clear redoStack
     * @example
     * imageEditor.clearRedoStack();
     */
    clearRedoStack() {
        this._module.clearRedoStack();
    }

    /**
     * Whehter the undo stack is empty or not
     * @returns {boolean}
     * imageEditor.isEmptyUndoStack();
     */
    isEmptyUndoStack() {
        return this._module.isEmptyUndoStack();
    }

    /**
     * Whehter the redo stack is empty or not
     * @returns {boolean}
     * imageEditor.isEmptyRedoStack();
     */
    isEmptyRedoStack() {
        return this._module.isEmptyRedoStack();
    }

    /**
     * Resize canvas dimension
     * @param {{width: number, height: number}} dimension - Max width & height
     */
    resizeCanvasDimension(dimension) {
            const mainModule = this._getMainModule();

            if (!dimension) {
                return;
            }

            mainModule.setCssMaxDimension(dimension);
            mainModule.adjustCanvasDimension();
        }
        /**
         * Destroy
         */
    destroy() {
        const wrapperEl = this._canvas.wrapperEl;

        this.endAll();
        this._detachDomEvents();

        this._canvas.clear();

        wrapperEl.parentNode.removeChild(wrapperEl);

        forEach(this, (value, key) => {
            this[key] = null;
        }, this);
    }

    /**
     * Set position
     * @param {object} options - Position options (left or top)
     * @private
     */
    _setPositions(options) {
        const centerPosition = this._canvas.getCenter();

        if (isUndefined(options.left)) {
            options.left = centerPosition.left;
        }

        if (isUndefined(options.top)) {
            options.top = centerPosition.top;
        }
    }


}

CustomEvents.mixin(FabricPhoto);

export default FabricPhoto;