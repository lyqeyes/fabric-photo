import util from '../lib/util';
import consts from '../consts';


const Arrow = fabric.util.createClass(fabric.Line, {
    /**
     * Constructor
     * @param {Object} options Options object
     * @override
     */
    initialize(options) {
        options.type = 'arrow';
        this.callSuper('initialize', options);
        this.on({
            'moving': this._onMoving,
            'scaling': this._onScaling
        });
    },
    objectCaching: false,

    /**
     * Render Crop-zone
     * @param {CanvasRenderingContext2D} ctx - Context
     * @private
     * @override
     */
    _render(ctx) {
        const cropzoneDashLineWidth = 7;
        const cropzoneDashLineOffset = 7;
        this.callSuper('_render', ctx);

        // Calc original scale
        const originalFlipX = this.flipX ? -1 : 1;
        const originalFlipY = this.flipY ? -1 : 1;
        const originalScaleX = originalFlipX / this.scaleX;
        const originalScaleY = originalFlipY / this.scaleY;

        // Set original scale
        ctx.scale(originalScaleX, originalScaleY);

        // Render outer rect
        this._fillOuterRect(ctx, 'rgba(0, 0, 0, 0.55)');

        // Black dash line
        this._strokeBorder(ctx, 'rgb(0, 0, 0)', cropzoneDashLineWidth);

        // White dash line
        this._strokeBorder(ctx, 'rgb(255, 255, 255)', cropzoneDashLineWidth, cropzoneDashLineOffset);

        // Reset scale
        ctx.scale(1 / originalScaleX, 1 / originalScaleY);
    }
});
export default Arrow;