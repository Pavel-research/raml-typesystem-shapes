import rti=require("raml1-domain-model")
export function isShapeOrReferenceOf(t: rti.Type, domain: rti.Type) {
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
    t.annotations().forEach(a => {
        var def = a.definition();
        if (a.name() == "shapeOf") {
            var vl = a.value();
            var reg = a.owner().registry();
            var value = reg.getType(vl);
            if (isShapeOrReferenceOf(value, domain)) {
                result = true;
            }
        }
    });
    t.annotations().forEach(a => {
        var def = a.definition();
        if (a.name() == "reference") {
            var vl = a.value();
            var reg = a.owner().registry();
            if (typeof vl == "string") {
                var vls = vl;
                var dotLocation = vls.lastIndexOf('.');
                if (dotLocation != -1) {
                    var dereference = vls.substring(0, dotLocation);
                    var value = reg.getType(dereference);
                    if (isShapeOrReferenceOf(value, domain)) {
                        result = true;
                    }
                }
            }
        }
    });
    return result;
}

export function canTransform(t: rti.Type, t1: rti.Type) {

}

export function domainType(t: rti.Type): rti.Type {
    return null;
}

export function transformToShape(domainObj: any, shape: rti.Type): any {

}