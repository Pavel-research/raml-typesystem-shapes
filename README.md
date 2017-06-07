# RAML Typesystem Shapes

**Problem statement**: different use cases require us to expose different representations(shapes) of same business entity. 

![Diagram](Domain_model.png)

One way to model it in `Callable` is [scopes](scopes.md), however some times you need to model different shapes 
of the same model entity as a separate RAML types.

`Callable` supports following alternative approach to modelling different shapes of the model entity:

Let's say that we have a `Task` data type which models a *Task* business entity   

```raml
Task:
  properties:
    id: integer
    name: string
    description: string
    subTasks: Task[]
```

However when new *Task* is being added in the system we represent it with following RAML type:   

```raml
NewTaskData:
  properties:
    name: string
    description: string
```

Now we need to mark that `NewTaskData` is not conceptually independent thing but just a representation of the `Task` data type
in `Callable` this may be done by using `shapeOf` annotation:

This annotation is defined by the following annotation type: 

```raml
shapeOf:
  type: common.RAMLObjectTypeRef  
```

`It is important that both target and value of this annotation may only be pure object types(no unions)`  

so if we would like to mark that `NewTaskData` is the shape of the `Task` we should
update `NewTaskData` to look as in the following example:
 
```raml
NewTaskData:
  properties:
    (callable.shapeOf): Task
    name: string
    description: string
```
 




---

## Conversion from the model to shape:  

Conversion from the model to shape is defined when system knows how to fill all properties
of shape type.

We use following algorithm to perform a conversion which is performed for every property 
of shape type.

1. If domain model has a property with a same name exists: check if the system knows how to transform value of this
property into value of the shape property. If transformation is undefined then whole conversion of model instance to 
shape instance can not be executed

2. If shape property has an annotation `property` and this annotation values is the name of the property
of domain class, or qualified name of the property of the domain class, then: check if the system knows how to transform value of this
property into value of the shape property. If transformation is undefined then whole conversion of model instance to 
shape instance can not be executed

Value conversion is executed by the following algorithm: 

1. if values have a type with same structural constraints then no conversion is needed
2. If target value is a shape of model property value then conversion from model to shape is executed
3. If target value is a reference to model property value then conversion to reference is executed
4. Otherwise conversion can not be performed and algorithm should abort.




```raml
PersonData:
  (core.shapeOf): Person
  properties:
    name: string
    lastName:
      (core.property): last_name
      type: string

```