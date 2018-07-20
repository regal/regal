# Agents

*Regal Specification 0.3*

## 1 Overview

Games built on the Regal Framework consist of two main parts: *Event Functions* and *Agents*. Whereas Event Functions can be thought to describe any change that occurs within your game, Agents are the objects on which the changes take place.

Every object that is contained in a game's state -- weapons, players, trees, mountains, even intangible state like score -- is considered an agent.

### 1.1 Definitions

**1.1.1** Unless otherwise defined, all terms from JavaScript, TypeScript, and software engineering in general have their standard meanings.

**1.1.2** *Regal Framework* is the collection of game libraries and services developed by Joe Cowman to create portable, function-based games.

**1.1.3** *Regal Library* refers to the TypeScript library that is meant to be consumed by games to be compatible with the Regal Framework.

**1.1.4** *Regal* is a general term that can refer to the Regal Framework or the Regal Library. In most cases, this specification uses it to refer to the library.

**1.1.5** *Game* refers to a game developed with Regal. This term should not be confused with `Game`, which is a namespace within the Regal Library. The latter term is formatted as it was here to avoid confusion.

**1.1.6** *Developer* or *consumer* refers to someone who develops a game for Regal, consuming the Regal Library.

**1.1.7** *Player* refers to someone who plays a game that was developed for Regal.

**1.1.8** *Client* refers to a user-facing application that a player uses to run and interact with a Regal game.

**1.1.9** *Command* refers to a command inputted by a player into a Regal client.

**1.1.10** *GameInstance*, *game instance*, and *instance* refer to an object of type `GameInstance`, which contains all data specific to a given player's game.

**1.1.11** *Event Function* and *event* refer to functions that were created with the `event` function, which describe any change that occurs on the state of a game instance.

**1.1.12** *Game cycle* refers to every event that occurs on a GameInstance after one command is entered by the player.

**1.1.13** *Output* refers to the updated GameInstance and accompanying metadata that are returned to the client after all events in a game cycle are completed.

**1.1.14** *Extrinsic state* or *instance state* refer to state that is stored in a GameInstance, and is player-dependent. It is computed based on the player's commands and the events that are caused by them.

**1.1.15** *Intrinsic state* refers to data that is defined in the game source code, rather than stored in the GameInstance. It can be referenced by any game instance, but not modified.

**1.1.16** *Agent* refers to an object used in a game. Agents can be thought of as anything encountered by a player that isn't an event. Agents can contain a combination of extrinsic and intrinsic state. When `Agent` is used as a proper noun or formatted as code, it refers to an object of the Regal class `Agent`. The more general term *agent*, used as an improper noun, refers to a child class of `Agent`.

## 2 `Agent` Class

The Regal Library offers a class `Agent` that the developer can use to create agents for their game.

This section provides an introduction to the public interface of the `Agent` class. Specifications of the concepts behind registering agents and static agents are covered in later sections.

### 2.1 `Agent` Schema

The schema for class `Agent`, including method signatures, is defined as follows:

```ts
class Agent {

    constructor()

    public [ID]: number

    private _game: GameInstance

    register(game: GameInstance): this

    static(): this
}
```

### 2.2 Constructing `Agent`

**2.2.1** `Agent` is not intended to be instantiated by the developer, but no measures are taken to prevent the developer from doing so. 

**2.2.2** If the developer instantiates `Agent`, the resulting object will have the same behaviors as any agent, but it will have no other properties. Thus, it will have no obvious purpose.

### 2.3 Extending `Agent`

**2.3.1** `Agent` is intended to be extended by the developer via the TypeScript class `extends` operation.

**2.3.2** In extending `Agent`, the developer is free to add any number of properties and/or methods to their agent class, none of which will interfere with the desired operation of `Agent`.

**2.3.3** The symbol property `ID` and methods `register` and `static` shall behave identically for `Agent` objects and any `Agent` subclass objects.

**2.3.4** The symbol property `ID` and methods `register` and `static` should not be overridden by the developer, as this will interfere with the desired operation of `Agent`. Unfortunately, the language provides no way to enforce this rule.

### 2.4 The `Agent[ID]` Property

**2.4.1** The name `ID` shall refer to a ES6 symbol that can be used internally or imported by any consumer of Regal.

**2.4.2** Every `Agent` shall have a public symbol property `ID` that refers to the agent's unique identifier within the context of the game instance.

**2.4.3** No two unique agents within one game instance shall ever have the same `ID`.

**2.4.4** It is possible for two agents across two game instances to have the same `ID`, but due to the nature of game instances, they should never interact with each other.

**2.4.5** The property `ID` shall have public read-access.

**2.4.6** An agent's `ID` is not defined until after the agent is registered §(Agent-3). Once the agent is registered, then `ID` is defined. 

**2.4.7** Accessing an agent's `ID` before the agent is registered shall return `undefined`.

**2.4.8** Accessing an agent's `ID` after the agent is registered shall return a positive integer.

**2.4.9** If the developer attempts to set the agent's `ID` after it has already been set, the following error shall be thrown: `RegalError: Cannot change an agent's ID once it has been set.`

### 2.5 The `Agent.register` Method

**2.5.1** `Agent.register` shall refer to the `register` method contained by objects that are of class `Agent` or a subclass.

**2.5.2** `Agent.register` shall register the agent with the game instance. This is a complex operation, therefore it is described in its own section. §(Agent-3)

**2.5.3** `Agent.register` shall take a single argument `game`: the `GameInstance` with which the agent is intended to be registered.

**2.5.4** If the `game` argument passed to `Agent.register` is undefined, the following error shall be thrown: `RegalError: The GameInstance must be defined to register the agent.`

**2.5.5** If `register` is called on an agent that already has an `ID`, the following error shall be thrown: `RegalError: Cannot register an agent that already has an ID.`

**2.5.6** `Agent.register` shall return a proxy to the object on which the method is called §(Agent-3.3), which is the same type as that object.

**2.5.7** `Agent.register` modifies the object on which it is called. Since the method requires a reference to a game instance, it must never be called outside of a game cycle.

### 2.6 The `Agent.static` Method

**2.6.1** `Agent.static` shall refer to the `static` method contained by objects that are of class `Agent` or a subclass.

**2.6.2** `Agent.static` shall create a reference to a static version of the agent on which the method is called. For details on static agents, see §(Agent-TBD).

**2.6.3** `Agent.static` shall take no arguments.

**2.6.4** The object returned by `Agent.static` shall be the same type as the object on which the method was called, but it shall not be the same object. §(Agent-TBD)

**2.6.5** If `static` is called on an agent that has already been made static, the following error shall be thrown: `RegalError: Cannot create two static versions of the same agent.`

**2.6.6** If `static` is called on an agent that has already been registered, the following error shall be thrown: `RegalError: Cannot create a static version of an agent that has already been registered.`

**2.6.7** All static agents must be created when the game is constructed §(Agent-TBD). Therefore, `Agent.static` must never be called inside of a game cycle.

### 2.7 `Agent` Private Properties

**2.7.1** `Agent` shall contain a private property `_game`, which shall not be accessible to external code.

## 3 Agent Registration

A game's instance state is composed of agents.

For agents to be used within a GameInstance, they must first be registered. This section describes that process.

### 3.1 Definitions

**3.1.1** *Unregistered* and *registered* shall describe an agent before and after its `register` method has been called, respectively.

**3.1.2** *Explicit registration* refers to registering an agent by calling its `register` method. §(Agent-3.3)

**3.1.3** *Implicit registration* refers to registering an agent by invoking some operation which eventually registers the agent explicitly. §(Agent-3.4)

**3.1.4** `GameInstance.agents` and the game instance's *agents* or *agents map* shall refer to the collection of agents stored by a game instance. §(Agent-3.2.1)

**3.1.5** `GameInstance.state` refers to the object used within a GameInstance to manage references to agents. §(Agent-3.2.2, Agent-3.5)

**3.1.6** The phrase "next available agent ID" refers to the next lowest positive nonzero integer that is not already the ID of a registered agent or reserved in the static agent registry. §(Agent-4.1.4)

**3.1.7** `AgentProxyHandler` refers to the handler object that contains traps to proxy all gets and sets to an agent's properties. §(Agent-5.3)

**3.1.8** An agent `B` is considered to be *managed* by another agent `A` if either: 

1. `B` is a contained in a property of `A`, or

2. `B` is contained in an array that is a property of `A`. 

In describing these situations, agent `A` is often called the *parent*, *managing*, or *top-level* agent.

**3.1.9** An agent `B` is considered to *become managed* by an already-registered agent `A` if either:

1. `B` is assigned to a property of `A`, 

2. `B` is included in an array that is assigned to a property of `A`, or

3. `B` is added to an array that is a property of `A`.

### 3.2 `GameInstance` Property Ownership

**3.2.1** `GameInstance` shall contain a public property `agents` that is of type `Map<number, object>`.

**3.2.2** `GameInstance` shall contain a public property `state` that is of type `any`.

**3.2.3** The propeties `agents` and `state` of `GameInstance` shall be managed entirely by `Agent` operations.

### 3.3 Explicit Registration

**3.3.1** An agent is registered with a game instance explicitly by calling the agent's `register` method with the game instance provided as the method's argument.

**3.3.2** Registering an agent with a game instance shall perform the following steps:

1. Check if the game instance is undefined. If so, throw an error. §(Agent-2.5.4)

2. Check if the agent has already been registered. If so, throw an error. §(Agent-2.5.5)

3. Set the agent's `_game` property equal to the game instance.

4. Set the agent's `ID` property equal to the next available agent ID.

5. Register every agent that is managed by the agent. §(Agent-3.3.3)

6. Construct a new Proxy, hereafter referred to as the proxy, using the agent and `AgentProxyHandler` as its handler.

7. Add the proxy to `GameInstance.agents`, with the key being the agent's `ID`.

8. Return the proxy.

**3.3.3** Registering an agent shall recursively attempt to register all agents that are *managed* by that agent §(Agent-3.1.8). For each of these managed agents, the library shall:

1. If the managed agent's `ID` is undefined, execute the managed agent's `register` method.

2. Replace the parent agent's reference to the managed agent with the managed agent's `ID`. §(Agent-3.3.4)

**3.3.4** Registered agents shall not contain object references to their managed registered agents. Instead, these references (both as property values and elements in array properties) shall be replaced by each managed agent's `ID`. §(Agent-3.3.3)

### 3.4 Implicit Registration

There shall exist several *implicit registration* operations that invoke an agent's `register` method as a consequence of their function. The operations that implicitly register an agent include:

**3.4.1** The agent is managed by a managing agent when the managing agent is registered. §(Agent-3.3.3)

**3.4.2** The agent becomes managed §(Agent-3.1.9) by an already-registered agent.

**3.4.3** The agent becomes managed by `GameInstance.state`. §(Agent-3.5.7)

### 3.5 `GameInstance.state`

**3.5.1** `GameInstance.state` is a reserved agent stored within the game instance to help the developer keep references to their agents. In this section, the shorthand `state` will be used.

**3.5.2** `state` shall be registered when the `GameInstance` is instantiated at the start of the game.

**3.5.3** `state` shall always be assigned the `ID` zero.

**3.5.4** `state` shall be typed as `any` so the developer can use the dot operator followed by any property name without triggering TypeScript errors.

**3.5.5** The developer may access any property within `state` by using a single dot operator followed by any name.

**3.5.6** The developer can set any property within `state` to be any type.

**3.5.7** Because `state` is a registered agent, agents shall be registered implicitly when they are assigned to a property of `state` or otherwise become managed by `state`. §(Agent-3.1.9, Agent-3.4.3)

**3.5.8** If the developer attempts to get a property `PROPERTY` from `state` that doesn't exist, the following error shall be thrown: `RegalError: State does not contain property <PROPERTY>.`

**3.5.9** Control of get and set access to `state`'s properties shall be managed by an additional proxy handler that is added to the agent before it is registered at the start of the game.

## 4 Static Agents

Static agents are agents that are defined at the game's *load time* rather than its *runtime*. They are useful for rarely-modified data that do not need to be stored in the instance state.

### 4.1 Definitions

**4.1.1.** *Static agent* refers to the object that is generated after an agent's `static` method is invoked.

**4.1.2** A game's *load time* refers to the initial execution of the game's source code when it is loaded by a Regal client. This includes the definition of all event functions, classes, API assignments, and static agents. There is no concept of a game instance at this stage.

**4.1.3** A game's *runtime* refers to the execution of some set of event functions during a game cycle. Most of the operations in this stage involve some operation on a game instance.

**4.1.4** The *static agent registry*, or `StaticAgentRegistry`, is a map used internally to manage references to static agents.

**4.1.5** `StaticAgentProxyHandler` refers to the handler object that contains proxy traps for all gets and sets to a static agent's properties. §(Agent-TBD)

### 4.2 Creating Static Agents (TBD)

**4.2.1** `StaticAgentRegistry` shall instantiated at a game's load time as an object of type `Map<number, Agent>` before any static agents are declared.

**4.2.2** An agent shall be made *static* by invocation of its `static` method. This process shall involve the following steps:

1. If the agent already has an `ID`, do the following:

    1. If the `ID` exists in `StaticAgentRegistry`, throw the following error: `RegalError: Cannot create two static versions of the same agent.`

    2. If the `ID` does not exist in `StaticAgentRegistry`, throw the following error: `RegalError: Cannot create a static version of an agent that has already been registered.`

2. Otherwise, set the agent's `ID` to be the next available agent ID.

3. Construct a Proxy from the agent and `StaticAgentProxyHandler`.

4. Add the proxy to the `StaticAgentRegistry`, with the key being the agent's `ID`.

5. Return the proxy.

**4.2.3** On a game instance's initial game cycle, every static agent in `StaticAgentRegistry` shall be registered with the game instance.

## 5 Agent Behavior

Introduction (TBD)

### 5.1 Definitions

(TBD)

### 5.2 Schemas

**5.2.1** `PropertyOperation` is an enum used to describe additions, modifications, or deletions of agent properties. It has the following values:

1. `ADDED`: This property was added to the agent with the specified value.

2. `MODIFIED`: This property existed on the agent already and was modified to the specified value.

3. `DELETED`: This property was removed from the agent.


**5.2.2** `PropertyChange<T>` is a class used to describe a single operation on an agent's property. It is parameterized to the type of the property. Its schema is defined as follows:

1. `public id: number`: The numeric id of the event during which the change took place.

2. `public op: PropertyOperation`: The operation that took place on the property. §(Agent-5.2.1)

3. `public init?: T`: The initial value of the property before the operation. Will be undefined if `op` is `ADDED`.

4. `public final?: T` The final value of the property after the operation. Will be undefined if `op` is `REMOVED`.

**5.2.3** `AgentRecord<T>` is a type used to describe the changes made to an agent's properties over one or more events, parameterized to the agent's type. `AgentRecord` objects contain zero or more of their agent's keys, each assigned to an array of `PropertyChange` objects of that property's type.

Example `AgentRecord`:

```ts
{
    "propertyA" : [
        {
            id: 2,
            action: PropertyOperation.MODIFIED,
            init: "intermediateValue",
            final: "finalValue"
        },
        {
            id: 1,
            action: PropertyOperation.MODIFIED,
            init: "startValue",
            final: "intermediateValue"
        }
    ],

    "propertyB" : [
        {
            id: 2,
            action: PropertyOperation.DELETED,
            init: "someValue"
        },
        {
            id: 1,
            action: PropertyOperation.ADDED,
            final: "someValue"
        }
    ]
}
```

(TBD)


### 5.3 Change Tracking

(TBD)

### 5.4 Event Sourcing

(TBD)