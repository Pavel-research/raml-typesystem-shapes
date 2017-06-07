import ts = require("raml-typesystem-light")
import chai = require("chai");
import shapes=require("../src/shapes");
var assert = chai.assert;
describe("Simple test", function () {
    it("basic case", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                NewPersonData: {
                    "(shapeOf)": "Person",
                    properties: {
                        name: "string",
                        lastName: "string",
                    }
                },
                Person2: "Person"
            }
        });
        var p2 = typeC.getType("Person2");
        var p = typeC.getType("Person");
        var npd = typeC.getType("NewPersonData");
        assert(shapes.isShapeOrReferenceOf(p2, p));
        assert(shapes.isShapeOrReferenceOf(npd, p));
    })
    it("references", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonId: {
                    type: "number",
                    "(reference)": "Person.id"
                }
            }
        });
        var p2 = typeC.getType("PersonId");
        var p = typeC.getType("Person");
        assert(shapes.isShapeOrReferenceOf(p2, p));
    })

});