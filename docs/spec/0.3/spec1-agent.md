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

**2.6.2** `Agent.static` shall create a reference to a static version of the agent on which the method is called. For details on static agents, see §(Agent-TBA).

**2.6.3** `Agent.static` shall take no arguments.

**2.6.4** The object returned by `Agent.static` shall be the same type as the object on which the method was called, but it shall not be the same object. §(Agent-TBA)

**2.6.5** If `static` is called on an agent that has already been made static, the following error shall be thrown: `RegalError: Cannot create two static versions of the same agent.`

**2.6.6** If `static` is called on an agent that has already been registered, the following error shall be thrown: `RegalError: Cannot create a static version of an agent that has already been registered.`

**2.6.7** All static agents must be created when the game is constructed §(Agent-TBA). Therefore, `Agent.static` must never be called inside of a game cycle.

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

**3.1.5** `GameInstance.state` refers to the object used within a game instance to manage references to agents. §(Agent-3.2.2, Agent-3.5)

**3.1.6** The phrase "next available agent ID" refers to the next lowest positive integer that is not already assigned to a registered agent.

**3.1.7** `AgentProxy` refers to an object that contains traps for all gets and sets to an agent's properties. §(Agent-5.3)

### 3.2 Schemas

**3.2.1** `GameInstance` shall contain a public property `agents` that is of type `Map<number, object>`.

**3.2.2** `GameInstance` shall contain a public property `state` that is of type `any`.

**3.2.3** The propeties `agents` and `state` of `GameInstance` shall be managed entirely by `Agent` operations.

### 3.3 Explicit Registration

**3.3.1** An agent is registered with a game instance explicitly by calling the agent's `register` method with the game instance provided as the method's argument.

**3.3.2** Registering an agent with a game instance shall perform the following steps:

* **3.3.2.1** Check if the game instance is undefined. If so, throw an error. §(Agent-2.5.4)

* **3.3.2.2** Check if the agent has already been registered. If so, throw an error. §(Agent-2.5.5)

* **3.3.2.3** Set the agent's `_game` property equal to the game instance.

* **3.3.2.4** Set the agent's `ID` property equal to the next available agent ID.

* **3.3.2.5** Construct a new Proxy using the agent and `AgentProxy`, hereafter referred to as the proxy.

* **3.3.2.6** Add the proxy to `GameInstance.agents`, with the key being the agent's `ID`.

* **3.3.2.7** Return the proxy.

### 3.4 Implicit Registration

(TBA)

### 3.5 `GameInstance.state`

(TBA)

## 4 Static Agents

Introduction (TBA)

### 4.1 Definitions

(TBA)

### 4.2 Schemas

(TBA)

### 4.3 Usage

(TBA)

## 5 Agent Behavior

Introduction (TBA)

### 5.1 Definitions

(TBA)

### 5.2 Schemas

(TBA)

### 5.3 Change Tracking

(TBA)

### 5.4 Event Sourcing

(TBA)