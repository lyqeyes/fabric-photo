import consts from '../consts';


import addObject from './add-object';
import remove from './remove';
import clear from './clear';

const {commandNames} = consts;
const creators = {};

creators[commandNames.CLEAR_OBJECTS] = clear;
creators[commandNames.ADD_OBJECT] = addObject;
creators[commandNames.REMOVE_OBJECT] = remove;

function (name, ...args) {
    return creators[name].apply(null, args);
}
export default {
   create
}