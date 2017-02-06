import Base from './base';
import consts from '../consts';
import util from '../lib/util.js';

const DEFAULT_CSS_MAX_WIDTH = 700;
const DEFAULT_CSS_MAX_HEIGHT = 400;

const cssOnly = {
    cssOnly: true
};
const backstoreOnly = {
    backstoreOnly: true
};
/*
 * 图形编辑器的 画板相关的设定 都需要在这里实现
 */
export default class Main extends Base {
    constructor() {
        super();
        this.name = consts.moduleNames.MAIN;

        /*Fabric canvas instance*/
        this.canvas = null;

        /*Fabric image instance*/
        this.canvasImage = null;

        /*Max width of canvas elements*/
        this.cssMaxWidth = DEFAULT_CSS_MAX_WIDTH;

        /*Max height of canvas elements*/
        this.cssMaxHeight = DEFAULT_CSS_MAX_HEIGHT;

        /*Image name*/
        this.imageName = '';
    }

    /**
     * To data url from canvas
     * @param {string} type - A DOMString indicating the image format. The default type is image/png.
     * @returns {string} A DOMString containing the requested data URI.
     */
    toDataURL(type) {
        return this.canvas && this.canvas.toDataURL(type);
    }

    /**
     * Save image(background) of canvas
     * @param {string} name - Name of image
     * @param {?fabric.Image} canvasImage - Fabric image instance
     * @override
     */
    setCanvasImage(name, canvasImage) {
        if (canvasImage) {
            util.stamp(canvasImage);
        }
        this.imageName = name;
        this.canvasImage = canvasImage;
    }

    /**
     * Set css max dimension
     * @param {{width: number, height: number}} maxDimension - Max width & Max height
     */
    setCssMaxDimension(maxDimension) {
        this.cssMaxWidth = maxDimension.width || this.cssMaxWidth;
        this.cssMaxHeight = maxDimension.height || this.cssMaxHeight;
    }

    /**
     * Set canvas element to fabric.Canvas
     * @param {jQuery|Element|string} element - Wrapper or canvas element or selector
     * @override
     */
    setCanvasElement(element) {
        let selectedElement;
        let canvasElement;

        if (element.jquery) {
            selectedElement = element[0];
        }
        else if (element.nodeType) {
            selectedElement = element;
        }
        else {
            selectedElement = document.querySelector(element);
        }

        if (!selectedElement || !selectedElement.nodeName) {
            throw new Error('容器元素是空');
        }

        if (selectedElement.nodeName.toUpperCase() !== 'CANVAS') {
            canvasElement = document.createElement('canvas');
            selectedElement.appendChild(canvasElement);
        }

        this.canvas = new fabric.Canvas(canvasElement, {
            containerClass: 'xm-fabric-photo-editor-canvas-container',
            enableRetinaScaling: false
        });

        //be used in zoom and panning
        if (this.canvas.wrapperEl) {
            this.canvas.wrapperEl.style['overflow'] = 'hidden';
        }
    }

    /**
     * Adjust canvas dimension with scaling image
     */
    adjustCanvasDimension() {
        //reset zoom to adjust canvas 
        this._zoom = 1;
        const canvasImage = this.canvasImage.scale(1);
        const boundingRect = canvasImage.getBoundingRect();
        const width = boundingRect.width;
        const height = boundingRect.height;
        const maxDimension = this._calcMaxDimension(width, height);
        this.setCanvasCssDimension({
            // width: '100%',
            // height: '100%', // Set height '' for IE9
            // 'max-width': `${maxDimension.width}px`,
            // 'max-height': `${maxDimension.height}px`
            width: `${maxDimension.width}px`,
            height: `${maxDimension.height}px`
        });
        this.setCanvasBackstoreDimension({
            width,
            height
        });
        this.canvas.centerObject(canvasImage);
        if (this.canvas.lowerCanvasEl) {
            this.canvas.lowerCanvasEl.style['top'] = '0px';
            this.canvas.lowerCanvasEl.style['left'] = '0px';
        }
        if (this.canvas.upperCanvasEl) {
            this.canvas.upperCanvasEl.style['top'] = '0px';
            this.canvas.upperCanvasEl.style['left'] = '0px';
        }
    }

    /**
     * Calculate max dimension of canvas
     * The css-max dimension is dynamically decided with maintaining image ratio
     * The css-max dimension is lower than canvas dimension (attribute of canvas, not css)
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @returns {{width: number, height: number}} - Max width & Max height
     * @private
     */
    _calcMaxDimension(width, height) {
        const wScaleFactor = this.cssMaxWidth / width;
        const hScaleFactor = this.cssMaxHeight / height;
        let cssMaxWidth = Math.min(width, this.cssMaxWidth);
        let cssMaxHeight = Math.min(height, this.cssMaxHeight);
        if (wScaleFactor < 1 && wScaleFactor < hScaleFactor) {
            cssMaxWidth = width * wScaleFactor;
            cssMaxHeight = height * wScaleFactor;
        }
        else if (hScaleFactor < 1 && hScaleFactor < wScaleFactor) {
            cssMaxWidth = width * hScaleFactor;
            cssMaxHeight = height * hScaleFactor;
        }
        return {
            width: Math.floor(cssMaxWidth),
            height: Math.floor(cssMaxHeight)
        };
    }

    /**
     * Set canvas dimension - css only
     *  {@link http://fabricjs.com/docs/fabric.Canvas.html#setDimensions}
     * @param {object} dimension - Canvas css dimension
     * @override
     */
    setCanvasCssDimension(dimension) {
        this.canvas.setDimensions(dimension, cssOnly);
    }

    /**
     * Set canvas dimension - backstore only
     *  {@link http://fabricjs.com/docs/fabric.Canvas.html#setDimensions}
     * @param {object} dimension - Canvas backstore dimension
     * @override
     */
    setCanvasBackstoreDimension(dimension) {
        this.canvas.setDimensions(dimension, backstoreOnly);
    }

    setZoom(zoom) {
        const canvasImage = this.canvasImage.scale(1);
        const boundingRect = canvasImage.getBoundingRect();
        const width = boundingRect.width;
        const height = boundingRect.height;
        const maxDimension = this._calcMaxDimension(width, height);
        //maximum is no more than twice the size of the picture
        if (zoom < 1 || zoom > width * 2 / maxDimension.width) {
            return;
        }
        const maxWidth = maxDimension.width * zoom;
        const maxHeight = maxDimension.height * zoom;

        if (this.canvas.lowerCanvasEl) {
            this.canvas.lowerCanvasEl.style['height'] = `${maxHeight}px`;
            this.canvas.lowerCanvasEl.style['width'] = `${maxWidth}px`;
            this.canvas.lowerCanvasEl.style['top'] = '0px';
            this.canvas.lowerCanvasEl.style['left'] = '0px';
        }
        if (this.canvas.upperCanvasEl) {
            this.canvas.upperCanvasEl.style['height'] = `${maxHeight}px`;
            this.canvas.upperCanvasEl.style['width'] = `${maxWidth}px`;
            this.canvas.upperCanvasEl.style['top'] = '0px';
            this.canvas.upperCanvasEl.style['left'] = '0px';
        }
        const wrapperWidth = parseInt(this.canvas.wrapperEl.style['height'], 10),
            wrapperHeight = parseInt(this.canvas.wrapperEl.style['width'], 10);

        if (this.cssMaxWidth > maxWidth || wrapperWidth > maxWidth) {
            this.canvas.wrapperEl.style['width'] = `${maxWidth}px`;
        }
        if (this.cssMaxHeight > maxHeight || wrapperHeight > maxHeight) {
            this.canvas.wrapperEl.style['height'] = `${maxHeight}px`;
        }
        this.canvas.renderAll();
        this._zoom = zoom;
    }


    getZoom() {
        return this._zoom;
    }

    /**
     * Set image properties
     * {@link http://fabricjs.com/docs/fabric.Image.html#set}
     * @param {object} setting - Image properties
     * @param {boolean} [withRendering] - If true, The changed image will be reflected in the canvas
     * @override
     */
    setImageProperties(setting, withRendering) {
        const canvasImage = this.canvasImage;

        if (!canvasImage) {
            return;
        }

        canvasImage.set(setting).setCoords();
        if (withRendering) {
            this.canvas.renderAll();
        }
    }

    /**
     * Returns canvas element of fabric.Canvas[[lower-canvas]]
     * @returns {HTMLCanvasElement}
     * @override
     */
    getCanvasElement() {
        return this.canvas.getElement();
    }

    /**
     * Get fabric.Canvas instance
     * @override
     * @returns {fabric.Canvas}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Get canvasImage (fabric.Image instance)
     * @override
     * @returns {fabric.Image}
     */
    getCanvasImage() {
        return this.canvasImage;
    }

    /**
     * Get image name
     * @override
     * @returns {string}
     */
    getImageName() {
        return this.imageName;
    }
}