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
        assert(shapes.isShapeOf(p2, p));
        assert(shapes.isShapeOf(npd, p));
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
        assert(shapes.isShapeOf(p2, p));
    })
    it("transform to reference", function () {
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
        assert(shapes.transformFunc(p, p2)({id: 4, name: "Pavel", "lastName": "Petrochenko"}) == 4);
    })
    it("ommit properties", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonData: {
                    properties: {
                        name: "string",
                        lastName: "string",
                    }
                }
            }
        });
        var p2 = typeC.getType("Person");
        var p = typeC.getType("PersonData");
        assert.deepEqual(shapes.transformFunc(p, p2)({name: "Pavel", "lastName": "Petrochenko"}), {
            name: "Pavel",
            "lastName": "Petrochenko"
        });
    })
    it("renaming properties", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonData: {
                    "(shapeOf)": "Person",
                    properties: {
                        name: "string",
                        last_name: {
                            "(property)": "lastName",
                            type: "string"
                        }
                    }
                }
            }
        });
        var p = typeC.getType("Person");
        var p2 = typeC.getType("PersonData");
        assert.deepEqual(shapes.transform({name: "Pavel", "lastName": "Petrochenko"}, p, p2), {
            name: "Pavel",
            "last_name": "Petrochenko"
        });
    })
    it("back from shape to domain", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonData: {
                    "(shapeOf)": "Person",
                    properties: {
                        name: "string",
                        last_name: {
                            "(property)": "lastName",
                            type: "string"
                        }
                    }
                }
            }
        });
        var p = typeC.getType("Person");
        var p2 = typeC.getType("PersonData");
        assert.deepEqual(shapes.transform({name: "Pavel", "last_name": "Petrochenko"}, p2, p), {
            name: "Pavel",
            "lastName": "Petrochenko"
        });
    })
    it("another simple back trip", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonData: {
                    "(shapeOf)": "Person",
                    properties: {
                        name: "string",
                        last_name: {
                            "(property)": "Person.lastName",
                            type: "string"
                        }
                    }
                }
            }
        });
        var p = typeC.getType("Person");
        var p2 = typeC.getType("PersonData");
        assert.deepEqual(shapes.transform({name: "Pavel", "last_name": "Petrochenko"}, p2, p), {
            name: "Pavel",
            "lastName": "Petrochenko"
        });
    })
    it("should throw error", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Person: {
                    properties: {
                        id: "number",
                        name: "string",
                        lastName: "string",
                    }
                },
                PersonData: {
                    "(shapeOf)": "Person",
                    properties: {
                        name: "string",
                        ee: "boolean",
                        last_name: {
                            "(property)": "lastName",
                            type: "string"
                        }
                    }
                }
            }
        });
        var p = typeC.getType("Person");
        var p2 = typeC.getType("PersonData");
        try {
            assert.deepEqual(shapes.transform({name: "Pavel", "lastName": "Petrochenko"}, p, p2), {
                name: "Pavel",
                "last_name": "Petrochenko"
            })
            ;
        } catch (e) {
            //should actually happen
        }
    })
    it("array of references", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Task: {
                    properties: {
                        id: "number",
                        name: "string",
                        description: "string",
                        subTasks: "Task[]"
                    }
                },
                TaskData: {
                    "(shapeOf)": "Task",
                    properties: {
                        id: "number",
                        name: "string",
                        subTasks: {
                            type: "array",
                            items: {
                                type: "integer",
                                "(reference)": "Task.id"
                            }
                        }
                    }
                }
            }
        });
        var p = typeC.getType("Task");
        var p2 = typeC.getType("TaskData");
        assert.deepEqual(shapes.transform({
            name: "Buy milk", "desription": "for Mom",
            id: 1,
            subTasks: [
                {
                    id: 2,
                    name: "Go to shop",
                    description: "Go to shop"
                }
            ]
        }, p, p2), {
            name: "Buy milk",
            id: 1,
            subTasks: [2]
        })
    })
    it("another shape", function () {
        var typeC = ts.parseJSONTypeCollection({
            types: {
                Task: {
                    properties: {
                        id: "number",
                        name: "string",
                        description: "string",
                        subTasks: "Task[]"
                    }
                },
                TaskData: {
                    "(shapeOf)": "Task",
                    properties: {
                        id: "number",
                        name: "string",
                        subTasks: {
                            type: "array",
                            items: {
                                type: "TaskRef",
                            }
                        }
                    }
                },
                TaskRef: {
                    "(shapeOf)": "Task",
                    properties: {
                        id: "number",
                    }
                }
            }
        });
        var p = typeC.getType("Task");
        var p2 = typeC.getType("TaskData");
        assert.deepEqual(shapes.transform({
            name: "Buy milk", "desription": "for Mom",
            id: 1,
            subTasks: [
                {
                    id: 2,
                    name: "Go to shop",
                    description: "Go to shop"
                }
            ]
        }, p, p2), {
            name: "Buy milk",
            id: 1,
            subTasks: [{id: 2}]
        })
    })
});