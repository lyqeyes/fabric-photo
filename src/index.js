import $ from 'jquery';
import fabric from 'fabric';


import imageLayout from './image-layout.js';
import module from './module';
import consts from './consts';


const events = consts.eventNames;
const components = consts.componentNames;
const commands = consts.commandNames;
const {states, keyCodes, fObjectOptions} = consts;
let defultOpt = {
    renderTo: '#container',
    thumb: ''
};
let DomURL = window.URL || window.webkitURL || window;

export default class FabricPhoto {

    constructor(source, options) {
        let _config = Object.assign(defultOpt, options);
        this.$container = $(_config.renderTo);
        if (this.$container.length === 0) {
            throw new Error('容器不存在');
        }
        this.config = _config;
        this.source = source;
        this.init();
    }

    init() {
        imageLayout.apply(this);
        this._module = new module();
        this._canvas = null;
        this._state = states.NORMAL;
    }

    destory() {}
    
    getContainerViewBox() {
        let {
            top,
            left,
            width,
            height
        } = this.$container[0].getBoundingClientRect();
        return {
            top,
            left,
            width,
            height
        };
    }
}