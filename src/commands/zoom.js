import util from '../lib/util';
import Command from './base';
import consts from '../consts';

const {moduleNames} = consts;
const {MAIN} = moduleNames;
export default function(rate){
    return new Command({
        /**
         * @param {object.<string, Component>} moduleMap - Modules injection
         * @returns {Promise}
         * @ignore
         */
        execute(moduleMap) {
            const canvas = moduleMap[MAIN].getCanvas();
                this.zoom = (canvas.viewportTransform[0] || 1);
                let zoom = rate * (canvas.viewportTransform[0] || 1);
                canvas.setZoom(zoom);
                return Promise.resolve();
        },
        /**
         * @param {object.<string, Component>} moduleMap - Modules injection
         * @returns {Promise}
         * @ignore
         */
        undo(moduleMap) {
            const canvas = moduleMap[MAIN].getCanvas();
            const canvasContext = canvas;
            canvas.setZoom.apply(canvasContext, this.zoom);
            return Promise.resolve();
        }
    });
}