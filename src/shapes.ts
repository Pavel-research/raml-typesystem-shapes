import rti=require("raml1-domain-model")

export type Type=rti.Type;

export type Func1=(x: any) => any;
type Func2=(x: any, y: any) => any;

function property(name: string): Func1 {
    return function (x) {
        return x ? x[name] : undefined
    }
}
function combine(f1: Func1, f2: Func1): Func1 {
    return function (x) {
        return f2(f1(x));
    }
}
const identity: Func1 = (x: any) => x;

function constFunc(val: any): Func1 {
    return function () {
        return val
    }
}

function dereference(path: string): Func1 {
    var result = identity;
    path.split(".").forEach(x => {
        result = combine(result, property(x));
    });
    return result;
}
function all2(f: Func2[]): Func2 {
    return function (x, y) {
        return f.map(v => v(x, y));
    }
}
function all(f: Func1[]): Func1 {
    return function (x) {
        return f.map(y => y(x));
    }
}
function storeTo(name: string, f: Func1): Func2 {
    return function (x, y) {
        y[name] = f(x);
    }
}
export function isShapeOf(t: rti.Type, domain: rti.Type) {
    if (t == domain) {
        return true;
    }
    if (t.isEmpty()) {
        if (t.superTypes().length == 1) {
            if (t.superTypes()[0] == domain) {
                return true;
            }
        }
    }
    var result = false;
    var reg = t.registry();
    var vl = t.annotation("shapeOf");
    if (vl) {
        var value = reg.getType(vl);
        if (isShapeOf(value, domain)) {
            result = true;
        }
    }
    var vl = t.annotation("reference");

    if (typeof vl == "string") {
        var vls = vl;
        var dotLocation = vls.lastIndexOf('.');
        if (dotLocation != -1) {
            var dereference = vls.substring(0, dotLocation);
            var value = reg.getType(dereference);
            if (isShapeOf(value, domain)) {
                result = true;
            }
        }
    }

    return result;
}
export function isDomainOf(source: rti.Type, target: rti.Type) {
    return isShapeOf(target, source);
}

function referenceValue(source: Type): string {
    return source.annotation("reference");
}

function referencePath(source: Type): string {
    var rv = referenceValue(source);
    if (!rv) {
        throw new Error("Target type is not a reference");
    }
    else {
        var propertyPath: string = null;
        var ti = rv.indexOf('.');
        if (ti != -1) {
            var tn0 = rv.substring(0, ti);
            var rs = source.registry();
            var tp = rs.getType(tn0);
            if (tp) {
                propertyPath = rv.substring(ti + 1);
            }
            else {
                ti = rv.indexOf('.', ti + 1);
                if (ti != -1) {
                    var tn0 = rv.substring(0, ti);
                    var tp = source.registry().getType(tn0);
                    if (tp) {
                        propertyPath = rv.substring(ti + 1);
                    }
                }
            }
        }
        if (propertyPath == null) {
            throw new Error("Unable to resolve property path");
        }
    }
    return propertyPath;
}
function resolveReference(source: Type, value: any): any {
    var propertyPath = referencePath(source);
    var segments = propertyPath.split('.');
    segments.forEach(x => {
        if (value) {
            value = value[x];
        }
    })
    return value;
}
function referenceResolver(source: Type): Func1 {
    var path = referencePath(source);
    if (path) {
        return dereference(path);
    }
    return null;
}

function propertyOf(prop: rti.Property, whereToLook: Type): rti.Property {
    var res: rti.Property = null;
    prop.range().annotations().forEach(a => {
        if (!res) {
            if (a.name() == "property") {
                var vl: string = a.value();
                var nms = vl.lastIndexOf('.');
                if (nms != -1) {
                    whereToLook = whereToLook.registry().getType(vl.substring(0, nms));
                    vl = vl.substring(nms + 1);
                }
                if (whereToLook == null) {
                    return null;
                }
                res = whereToLook.property(vl);
            }
        }
    })
    return res;
}
function transfer(instance: any, sourceProp: rti.Property, targetProp: rti.Property, target: any, referenceResolver?: (v: any, referenceType: Type) => any) {
    var pv = instance[sourceProp.name()];
    var vl = transform(pv, sourceProp.range(), targetProp.range(), referenceResolver);
    target[targetProp.name()] = vl;
}

function transferFunction(sourceProp: rti.Property, targetProp: rti.Property, referenceResolver?: (v: any, referenceType: Type) => any) {
    return storeTo(targetProp.name(), combine(property(sourceProp.name()), transformFunc(sourceProp.range(), targetProp.range())))
}

function isAssignable(source: Type, target: Type): boolean {
    if (source == target) {
        return true;
    }
    if (source.isScalar() && target.isScalar()) {
        if (source.isBoolean()) {
            if (target.isBoolean()) {
                return true;
            }
            return false;
        }
        else if (source.isString()) {
            if (target.isString()) {
                return true;
            }
            if (target.isScalar()) {
                if (target.isBoolean() || target.isNumber()) {
                    return false;
                }
                return true;
            }
            return false;
        }
        return true;
    }
    if (source.allSuperTypes().indexOf(target) != -1) {
        return true;
    }
    return false
}
function combineInTransform(ss: Func2[]) {
    return function (v) {
        var rs = {};
        ss.forEach(x => x(v, rs));
        return rs;
    }
}
export function transformFunc(source: Type, target: Type): Func1 {
    if (isAssignable(source, target)) {
        return identity;
    }
    if (source.isObject() && target.isObject()) {
        if (isShapeOf(source, target)) {
            var functions: Func2[] = []
            var hasError = false;
            source.properties().forEach(x => {
                if (x.isAdditional() || x.isPattern()) {
                    hasError = true;
                }
                else {
                    var nm = target.property(x.name());
                    if (!nm) {
                        nm = propertyOf(x, target);
                    }
                    if (nm) {
                        var tf = transferFunction(x, nm);
                        if (!tf) {
                            hasError = true;
                        }
                        functions.push(tf)
                    }
                    else {
                        hasError = true;
                    }
                }
            })
            return combineInTransform(functions);
        }

        else {
            var functions: Func2[] = []
            var hasError = false;
            target.properties().forEach(x => {
                if (x.isAdditional() || x.isPattern()) {
                    hasError = true;
                }
                else {
                    var nm = source.property(x.name());
                    if (!nm) {
                        nm = propertyOf(x, source);
                    }
                    if (nm) {
                        var tf = transferFunction(nm, x);
                        if (!tf) {
                            hasError = true;
                        }
                        functions.push(tf)
                    }
                }
            })
            return combineInTransform(functions);
        }
    }
    if (source.isObject() && target.isScalar()) {
        return referenceResolver(target);
    }
    if (source.isArray() && target.isArray()) {
        var sp = source.componentType();
        var tt = target.componentType();
        var tf = transformFunc(sp, tt);
        if (tf) {
            return function (v: any[]) {
                return v.map(tf);
            }
        }
    }
    return null;
}
export function transform(instance: any, source: Type, target: Type, referenceResolver?: (v: any, referenceType: Type) => any): any {
    if (source == target) {
        return instance;
    }
    if (source == null || source == undefined) {
        return null;
    }
    var func = transformFunc(source, target);
    if (!func) {
        throw new Error("Can not construct transform function to transform from:" + source.name() + " to " + target.name())
    }
    return func(instance);
}