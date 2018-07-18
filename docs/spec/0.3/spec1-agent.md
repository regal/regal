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

**1.1.5** *Game* refers to a game developed for Regal. This term should not be confused with `Game`, which is a namespace within the Regal Library. The latter term is formatted as it was here to avoid confusion.

**1.1.6** *Developer* or *consumer* refers to someone who develops a game for Regal, consuming the Regal Library.

**1.1.7** *Player* refers to someone who plays a game that was developed for Regal.

**1.1.8** *Client* refers to a user-facing application that a player uses to run and interact with a Regal game.

**1.1.9** *Command* refers to a command inputted by a player.

**1.1.10** *GameInstance*, *game instance*, and *instance* refer to an object of type `GameInstance`, which contains all data specific to a given player's game.

**1.1.11** *Event Function* and *event* refer to functions that were created with the `event` function, which accept a GameInstance and return the updated GameInstance.

**1.1.12** *Game cycle* refers to every event that occurs on a GameInstance after a command is entered by the player.

**1.1.13** *Output* refers to the updated GameInstance and accompanying metadata that are returned to the client after all events in a game cycle are completed.

**1.1.14** *Extrinsic state* or *instance state* refer to state that is stored in a GameInstance, and is player-dependent. It is computed based on the player's commands and the events that occur as a result.

**1.1.15** *Intrinsic state* refers to data that is defined in the game source code, rather than the GameInstance. It can be referenced by any game instance, but not modified.

**1.1.16** *Agent* refers to an object used in a game. Agents can be thought of as anything encountered by a player that isn't an event. Agents can contain a combination of extrinsic and intrinsic state. When `Agent` is used as a proper noun or formatted as code, it refers to an object of the Regal class `Agent`. The more general term *agent*, used as an improper noun, refers to a child class of `Agent`.

## 2 `Agent` Class

The Regal Library offers a class `Agent` that the developer can use to create agents for their game.

### 2.1 `Agent` Schema

```ts
class Agent {

    constructor()

    public [ID]

    register(game: GameInstance): this

    static(): this

}
```

### 2.2 Constructing `Agent`

**2.2.1** `Agent` is not meant to be instantiated by the developer, but no measures are taken to prevent the developer from doing so. 

**2.2.2** An `Agent` object will serve no purpose.

### 2.3 Extending `Agent`

**2.3.1** `Agent` is designed to be extended by the developer via the TypeScript class `extends` operation.

**2.3.2** In extending `Agent`, the developer is free to add any number of properties and/or methods to their agent class, none of which will interfere with the desired operation of `Agent`.

**2.3.3** The symbol property `[ID]` and methods `register` and `static` should not be overridden by the developer, as this will interfere with the desired operation of `Agent`. Unfortunately, the language provides no way to enforce this rule.

### 2.4 Symbol Property `[ID]`

TBA