function isUndefined(obj) {
    return obj === undefined;
}

function isNull(obj) {
    return obj === null;
}

function isTruthy(obj) {
    return isExisty(obj) && obj !== false;
}

function isFalsy(obj) {
    return !isTruthy(obj);
}

function isArguments(obj) {
    var result = isExisty(obj) &&
        ((toString.call(obj) === '[object Arguments]') || !!obj.callee);

    return result;
}

function isArray(obj) {
    return Array.isArray(obj);
}

function isFunction(obj) {
    return obj instanceof Function;
}

function createObject() {
    function F() {}

    return function(obj) {
        F.prototype = obj;
        return new F();
    };
}

function inherit(subType, superType) {
    var prototype = createObject(superType.prototype);
    prototype.constructor = subType;
    subType.prototype = prototype;
}

var lastId = 0;

function stamp(obj) {
    obj.__xm_id = obj.__xm_id || ++lastId;
    return obj.__xm_id;
}

function pick(obj, paths) {
    var args = arguments,
        target = args[0],
        length = args.length,
        i;
    try {
        for (i = 1; i < length; i++) {
            target = target[args[i]];
        }
        return target;
    }
    catch (e) {
        return;
    }
}

function hasStamp(obj) {
    return isExisty(pick(obj, '__xm_id'));
}

function resetLastId() {
    lastId = 0;
}

function compareJSON(object) {
    var leftChain,
        rightChain,
        argsLen = arguments.length,
        i;

    function isSameObject(x, y) {
        var p;

        if (isNaN(x) &&
            isNaN(y) &&
            tui.util.isNumber(x) &&
            tui.util.isNumber(y)) {
            return true;
        }

        if (x === y) {
            return true;
        }

        if ((tui.util.isFunction(x) && tui.util.isFunction(y)) ||
            (x instanceof Date && y instanceof Date) ||
            (x instanceof RegExp && y instanceof RegExp) ||
            (x instanceof String && y instanceof String) ||
            (x instanceof Number && y instanceof Number)) {
            return x.toString() === y.toString();
        }

        if (!(x instanceof Object && y instanceof Object)) {
            return false;
        }

        if (x.isPrototypeOf(y) ||
            y.isPrototypeOf(x) ||
            x.constructor !== y.constructor ||
            x.prototype !== y.prototype) {
            return false;
        }

        if (tui.util.inArray(x, leftChain) > -1 ||
            tui.util.inArray(y, rightChain) > -1) {
            return false;
        }

        for (p in y) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }
        }

        for (p in x) {
            if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                return false;
            }
            else if (typeof y[p] !== typeof x[p]) {
                return false;
            }

            if (typeof(x[p]) === 'object' || typeof(x[p]) === 'function') {
                leftChain.push(x);
                rightChain.push(y);

                if (!isSameObject(x[p], y[p])) {
                    return false;
                }

                leftChain.pop();
                rightChain.pop();
            }
            else if (x[p] !== y[p]) {
                return false;
            }
        }

        return true;
    }

    if (argsLen < 1) {
        return true;
    }

    for (i = 1; i < argsLen; i++) {
        leftChain = [];
        rightChain = [];

        if (!isSameObject(arguments[0], arguments[i])) {
            return false;
        }
    }

    return true;
}


function clamp(value, minValue, maxValue) {
        let temp;
        if (minValue > maxValue) {
            temp = minValue;
            minValue = maxValue;
            maxValue = temp;
        }

        return max(minValue, min(value, maxValue));
    }
    
function keyMirror(...args) {
        const obj = {};

        args.forEach(key => {
            obj[key] = key;
        });

        return obj;
    }
   function makeStyleText(styleObj) {
        let styleStr = '';
        styleObj.forEach((value, prop) => {
            styleStr += `${prop}: ${value};`;
        });

        return styleStr;
    }
export default {
    createObject: createObject(),
    inherit: inherit,
    isFunction: isFunction,
    isArray: isArray,
    isArguments: isArguments,
    isFalsy: isFalsy,
    isTruthy: isTruthy,
    isNull: isNull,
    isUndefined: isUndefined,
    compareJSON: compareJSON,
    hasStamp: hasStamp,
    resetLastId: resetLastId,
    stamp: stamp,
    pick: pick,
    clamp:clamp,
    keyMirror:keyMirror
}