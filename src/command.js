import consts from './consts';


import addObject from './commands/add-object';
import remove from './commands/remove';
import clear from './commands/clear';

const {commandNames} = consts;
const creators = {};

creators[commandNames.CLEAR_OBJECTS] = clear;
creators[commandNames.ADD_OBJECT] = addObject;
creators[commandNames.REMOVE_OBJECT] = remove;

function create(name, ...args) {
    return creators[name].apply(null, args);
}
export default {
   create
}