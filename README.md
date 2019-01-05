# Regal

[![npm version](https://badge.fury.io/js/regal.svg)](https://badge.fury.io/js/regal)
[![CircleCI](https://circleci.com/gh/regal/regal.svg?style=svg)](https://circleci.com/gh/regal/regal)
[![Coverage Status](https://coveralls.io/repos/github/regal/regal/badge.svg?branch=master)](https://coveralls.io/github/regal/regal?branch=master)

## Introduction

The **Regal Game Library** is the official TypeScript library for the [**Regal Framework**](https://github.com/regal/about), a project designed to help developers bring text-driven games and story experiences to players in exciting new ways.

### What is the Regal Framework?

The **Regal Framework** is a set of tools for developers to create text-driven games, sometimes called [Interactive Fiction (IF)](https://en.wikipedia.org/wiki/Interactive_fiction), as pure functions.

For more information, check out the project's [about](https://github.com/regal/about) page.

### How is the Regal Game Library Used?

The **Regal Game Library**, often referred to as the *Game Library* or its package name `regal`, is the JavaScript library that game developers use to create games for the Regal Framework. It was designed with first-class support for [TypeScript](https://www.typescriptlang.org/), but doesn't require it.

When a game is created using the Regal Game Library, it can be played by any Regal client automatically.

### What's the point?

Similar to Java's *"write once, run anywhere"* mantra, the goal of the **Regal Framework** is to produce games that can be played on all kinds of platforms without needing to rewrite any code.

The name _Regal_ is an acronym for **Re**inventing **G**ameplay through **A**udio and **L**anguage. The project was inspired by the idea of playing adventure games on smart voice assistants, but it doesn't have to stop there. Chatrooms, consoles, smart fridges...they're all within reach!

## Table of Contents

* [Introduction](#introduction)
    * [What is the Regal Framework?](#what-is-the-regal-framework)
    * [How is the Regal Game Library used?](#how-is-the-regal-game-library-used)
    * [What's the point?](#whats-the-point)
* [Installation](#installation)
* [Guide: Creating Your First Regal Game](#guide-creating-your-first-regal-game)
* [Documentation](#documentation)
    * [Core Concepts](#core-concepts)
    * [`GameInstance`](#gameinstance)
    * [Events](#events)
    * [Agents](#agents)
    * [Randomness](#randomness)
    * [`GameApi` and API Hooks](#gameapi-and-api-hooks)
    * [Configuration](#configuration)
    * [Bundling](#bundling)
* [API Reference](#api-reference)
* [Contributing](#contributing)
* [Project Roadmap](#project-roadmap)

## Installation

`regal` is available on [npm](https://www.npmjs.com/package/regal) and can be installed with the following command:

```
npm install regal
```

If you're using TypeScript (highly recommended), import it into your files like so:

```ts
import { GameInstance } from "regal";
```

Otherwise, using Node's `require` works as well:

```js
const regal = require("regal");
```

## Guide: Creating Your First Regal Game

The following is a step-by-step guide for creating a basic game of *Rock, Paper, Scissors* with Regal and TypeScript. 

For more detailed information on any topic, see the [API Reference](#api-reference) below. Everything in this guide is available in the Regal [**demos**](https://github.com/regal/demos/tree/master/my-first-game) repository as well.

### Step 1. Set up project

Start with an empty folder. Create a `package.json` file in your project's root directory with at least the following properties:

```json
{
    "name": "my-first-game",
    "version": "1.0.0"
}
```

Then, install the `regal` dependency.

```
npm install regal
```

Since your game will be written in TypeScript (as is recommended for all Regal games), you'll need to install `typescript` as well:

```
npm install --save-dev typescript
```

Create a `src` directory and a new file called `index.ts` inside it. This is where you'll write your game logic.

At this point, your project should have the following structure:

```
.
├── node_modules
├── package.json
├── package-lock.json
└── src
    └── index.ts
```

### Step 2. Write game logic

In `index.ts`, place the following import statement on the top line:
```ts
import { onPlayerCommand, onStartCommand } from "regal";
```

The Regal Game Library has [**way more**](#api-reference) tools to help you make games, but these imports are all you need for a game this basic.

Beneath the import line, paste the following constants. You'll use these when writing the game's logic. `WIN_TABLE` is a lookup table to see if one move beats another. For example, `WIN_TABLE.paper.scissors` is `false`, since paper loses to scissors.
```ts
const POSSIBLE_MOVES = ["rock", "paper", "scissors"];
const WIN_TABLE = {
    rock: {
        paper: false,
        scissors: true
    },
    paper: {
        rock: true,
        scissors: false
    },
    scissors: {
        rock: false,
        paper: true
    }
}
```

Next, you'll set the game's start behavior with `onStartCommand`. When a player starts a new game, both the player's and the opponent's scores will be initialized to zero, and a prompt will be displayed. Paste the following block of code beneath your constants:
```ts
onStartCommand(game => {
    // Initialize state
    game.state.playerWins = 0;
    game.state.opponentWins = 0;

    // Prompt the player
    game.output.write("Play rock, paper, or scissors:");
});
```

Finally, you need the actual gameplay. The following block should be pasted at the end of your file. It contains the behavior that runs every time the player enters a command.

```ts
onPlayerCommand(command => game => {
    // Sanitize the player's command
    const playerMove = command.toLowerCase().trim();

    // Make sure the command is valid
    if (POSSIBLE_MOVES.includes(playerMove)) {
        // Choose a move for the opponent
        const opponentMove = game.random.choice(POSSIBLE_MOVES);
        game.output.write(`The opponent plays ${opponentMove}.`);

        if (playerMove === opponentMove) {
            game.output.write("It's a tie!");
        } else {
            // Look up who wins in the win table
            const isPlayerWin = WIN_TABLE[playerMove][opponentMove];

            if (isPlayerWin) {
                game.output.write(`Your ${playerMove} beats the opponent's ${opponentMove}!`);
                game.state.playerWins++;
            } else {
                game.output.write(`The opponent's ${opponentMove} beats your ${playerMove}...`);
                game.state.opponentWins++;
            }
        }
        // Print win totals
        game.output.write(
            `Your wins: ${game.state.playerWins}. The opponent's wins: ${game.state.opponentWins}`
        );
    } else {
        // Print an error message if the command isn't rock, paper, or scissors
        game.output.write(`I don't understand that command: ${playerMove}.`);
    }

    // Prompt the player again
    game.output.write("Play rock, paper, or scissors:");
});
```

One last thing: the line `if (POSSIBLE_MOVES.includes(playerMove)) {` uses `Array.prototype.includes`, which is new in [ECMAScript 2016](https://www.ecma-international.org/ecma-262/7.0/). To make the TypeScript compiler compatible with this, add a `tsconfig.json` file to your project's root directory with the following contents:

```json
{
    "compilerOptions": {
        "lib": ["es2016"]
    }
}
```

### Step 3. Bundle game

Before your game can be played, it must be bundled. *Bundling* is the process of converting a Regal game's **development source** (i.e. the TypeScript or JavaScript source files that the game developer writes) into a **game bundle**, which is a self-contained file that contains all the code necessary to play the game via a single API.

Game bundles are the form through which Regal games are shared, downloaded, and played.

[**regal-bundler**](https://github.com/regal/regal-bundler) is a tool for creating Regal game bundles. Install it like so:
```
npm install --save-dev regal-bundler
```

Create a file in your root directory called `build.js` and paste the following code:
```js
const bundle = require("regal-bundler").bundle;

bundle();
```

This imports the `bundle` function from **regal-bundler** and executes it. See the bundler's [documentation](https://github.com/regal/regal-bundler#configuration) for a list of the configuration options you can use.

Run your build script:
```
node build.js
```

This should generate a new file in your project's directory called `my-first-game.regal.js`. *Your first game is bundled and ready to be played!*

### Step 4. Play game

Currently, there isn't a standard way to load a Regal game bundle for playing, although one is coming soon. For now, create a file in your project's root directory called `play.js` with the following contents:

```js
// Import required modules
const game = require("./my-first-game.regal");
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// Helper function to print output lines
const printLines = gameResponse => {
    console.log("");
    for (const line of gameResponse.output.log) {
        console.log(line.data);
    }
};

// Global to store the current game instance
let GAME_INSTANCE;

// Start game
const start = game.postStartCommand();
printLines(start);
GAME_INSTANCE = start.instance;

// Send each command to the game
readline.on("line", command => {
    const resp = game.postPlayerCommand(GAME_INSTANCE, command);
    printLines(resp);
    GAME_INSTANCE = resp.instance;
});
```

This script allows you to play your game via the Node terminal. Note that it requires the `readline` module, which should be installed like so:
```
npm install --save-dev readline
```

Finally, start your game with the following command:
```
node play.js
```

This starts the game in the Node terminal. Enter `rock`, `paper`, or `scissors` to play, or press `Ctrl+C` to quit the game. The sequence should look something like this:
```
Play rock, paper, or scissors:
paper

The opponent plays rock.
Your paper beats the opponent's rock!
Your wins: 1. The opponent's wins: 0
Play rock, paper, or scissors:

```

Congratulations, you've created your first game with the **Regal Framework**! :tada:

## Documentation

The following sections provide a guide to each aspect of the Regal Game Library. For detailed information on a specific item, consult the [API Reference](#api-reference).

### Core Concepts

The **Regal Game Library** is a JavaScript package that is required by games to be used within the **Regal Framework**. A game that is built using the Game Library is called a *Regal game*.

Regal games have the following qualities:
* They are **text-based**. Simply put, gameplay consists of the player putting text in and the game sending text back in response.
* They are **deterministic**. When a Regal game is given some input, it should return the same output every time (see [*randomness*](#randomness)).

These two qualities allow Regal games to be thought of as **pure functions**. A *pure function* is a function that is deterministic and has no side-effects. In other words, a Regal game is totally self-contained and predictable.

Think of playing a Regal game like the following equation:
```
g1(x) = g2

where x is the player's command
g1 is the Regal game before the command
g2 is the Regal game after the command
```

Entering the player's command into the first **game instance** creates another **game instance** with the effects of the player's command applied. For example, if `g1` contains a scene where a player is fighting an orc, and `x` is `"stab orc"`, `g2` might show the player killing that orc. Note that `g1` is unmodified by the player's command.

#### Game Data

All data or information in a Regal game is in one of two forms: **static** or **instance-specific**.

*Static information* is defined in the game's source code, and is the same for every instance of the game. Game events, for example, are considered static because they are defined the same way for everyone playing the game (even though they may have different effects).

*Instance-specific* information, more frequently called *game state*, is unique to a single instance of the game. A common example of game state is a player's stats, such as health or experience. Because this data is unique to one player of the game and is not shared by all players, it's considered instance-specific.

### `GameInstance`

The cornerstone of the Regal Game Library is the `GameInstance`. 

### Events

### Agents

### Randomness

### `GameApi` and API Hooks

### Configuration

### Bundling

## API Reference

### `Agent`

**_Class_**

A game object.

```ts
class Agent {
    id: number
    constructor()
}
```

#### Description

A game object, or *agent*, is a JavaScript object that contains Regal game state. Every agent should inherit from the `Agent` class.

Before an agent's properties can be accessed in a game cycle, the agent must be activated with [`GameInstance.using()`](#gameinstance-1). If you try to read or modify the property of an agent that hasn't been activated, a `RegalError` will be thrown.

#### Constructor

Constructs a new `Agent`. This constructor should almost never be called directly, but rather should be called with `super()` from a subclass.

If called in the game's static context (i.e. outside of a game cycle), a static agent will be created, and an id will be reserved for this agent for all game instances.

#### Properties

Property | Description
--- | ---
`id: number` | The agent's unique identifier in the context of the current game.

### `Charsets`

**_Const Object_**

Common charsets used for pseudo-random string generation.

```ts
const Charsets = {
    EXPANDED_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+{}[]|;:<>,.?"
    ALHPANUMERIC_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ALPHABET_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    NUMBERS_CHARSET: "0123456789"
}
```

#### Description

For use with [`InstanceRandom.string()`](#instancerandom).

#### Readonly Properties

Property | Value | Description
--- | --- | ---
`EXPANDED_CHARSET: string` | `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+{}[]\|;:<>,.?` | Contains all letters (upper- and lower-case), numbers, and some special characters.
`ALHPANUMERIC_CHARSET: string` | `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789` | Contains all letters (upper- and lower-case) and numbers.
`ALPHABET_CHARSET: string` | `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz` | Contains all letters (upper- and lower-case).
`NUMBERS_CHARSET: string` | `0123456789` | Contains all numbers.

### `EventFunction`

**_Type Alias_**

A function that modifies a [`GameInstance`](#gameinstance-1).

```ts
type EventFunction<StateType = any> = (
    game: GameInstance<StateType>
) => EventFunction<StateType> | void
```

#### Subtypes

* [`TrackedEvent`](#trackedevent)

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Parameters

Parameter | Description
--- | ---
`game: GameInstance<StateType>` | The game instance to be modified.

#### Returns

`EventFunction<StateType> | void`: The next `EventFunction` to be executed, or `void` if there are no more events.

### `EventQueue`

**_Interface_**

Contains a queue of `TrackedEvent`s to be executed sequentially.

```ts
interface EventQueue<StateType = any> extends TrackedEvent<StateType> {
    immediateEvents: Array<TrackedEvent<StateType>>
    delayedEvents: Array<TrackedEvent<StateType>>
    enqueue(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
    nq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
}
```

#### Description

An `EventQueue` is a special type of [`TrackedEvent`](#trackedevent) that contains a sequence of `TrackedEvent`s. When an `EventQueue` is invoked, it immediately invokes every event in `immediateEvents` sequentially. The events in `delayedEvents` are added to the end of the game instance's internal queue and will be invoked sequentially once all other events are finished.

The `EventQueue`/[`TrackedEvent`](#trackedevent) API is chainable and can be used to invoke a complicated sequence of events.

```ts
firstEvent.then(secondEvent, thirdEvent).enqueue(lastEvent)
```

#### Extends

[`TrackedEvent`](#trackedevent)

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Properties

Property | Description
--- | ---
`immediateEvents: Array<TrackedEvent<StateType>>` | The events to be added to the beginning of the game's event queue.
`delayedEvents: Array<TrackedEvent<StateType>>` | The events to be added to the end of the game's event queue.

#### Methods

##### `enqueue()`

Adds events to the end of the event queue.

```ts
enqueue(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
```

**Parameters**

Parameter | Description
--- | ---
`...events: Array<TrackedEvent<StateType>>` | The events to be added.

**Returns**

`EventQueue<StateType>`: A new `EventQueue` with the new events added to the queue.

##### `nq()`

Alias of [`EventQueue.enqueue()`](#enqueue).

```ts
nq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
```

### `Game`

**_Const Object_**

Global implementation of [`GameApiExtended`](#gameapiextended).

```ts
const Game: GameApiExtended = { ... }
```

#### Description

The `Game` object serves as an exportable API for playing the game. It is used for external interaction with the game, and shouldn't be accessed within the game itself.

#### Implements

[`GameApiExtended`](#gameapiextended)

### `GameApi`

**_Interface_**

Public API for interacting with the Regal game.

```ts
interface GameApi {
    getMetadataCommand(): GameResponse
    postPlayerCommand(instance: GameInstance, command: string): GameResponse
    postStartCommand(options?: Partial<GameOptions>): GameResponse
    postUndoCommand(instance: GameInstance): GameResponse
    postOptionCommand(instance: GameInstance, options: Partial<GameOptions>): GameResponse
}
```

#### Description

A client application will consume this API, using the endpoints to generate game instances and receive output.

#### Subtypes

* [`GameApiExtended`](#gameapiextended)

#### Methods

##### `getMetadataCommand()`

Gets the game's metadata. Note that this is not specific to any [`GameInstance`](#gameinstance-1), but refers to the game's static context.

```ts
getMetadataCommand(): GameResponse
```

**Returns**

[`GameResponse`](#gameresponse): A game response containing the game's metadata as output if the request was successful. Otherwise, the response will contain an error.

##### `postPlayerCommand()`

Submits a command that was entered by the player, usually to trigger some effects in the [`GameInstance`](#gameinstance-1).

If the [`onPlayerCommand`](#onplayercommand) hook has not been implemented, an error will be thrown.

```ts
postPlayerCommand(instance: GameInstance, command: string): GameResponse
```

**Parameters**

Parameter | Description
--- | ---
`instance: GameInstance` | The current game instance (will not be modified).
`command: string` | The player's command.

**Returns**

[`GameResponse`](#gameresponse): A game response containing a new [`GameInstance`](#gameinstance-1) with updated values and any output logged during the game cycle's events if the request was successful. Otherwise, the response will contain an error.

##### `postStartCommand()`

Triggers the start of a new game instance.

If the [`onStartCommand`](#onstartcommand) hook has not been implemented, an error will be thrown.

```ts
postStartCommand(options?: Partial<GameOptions>): GameResponse
```

**Parameters**

Parameter | Description
--- | ---
`options?: Partial<GameOptions>` | Any option overrides preferred for this specific instance, which must be allowed by the static configuration's `allowOverrides` option.

**Returns**

[`GameResponse`](#gameresponse): A game response containing a new [`GameInstance`](#gameinstance-1) and any output logged during the game cycle's events if the request was successful. Otherwise, the response will contain an error.

##### `postUndoCommand()`

Reverts the effects of the last player command on the game instance.

Calls the [`beforeUndoCommand`](#beforeundocommand) hook to determine if the undo is allowed. If the hook has not been implemented, undo is allowed by default.

```ts
postUndoCommand(instance: GameInstance): GameResponse
```

**Parameters**

Parameter | Description
--- | ---
`instance: GameInstance` | The current game instance (will not be modified).

**Returns**

[`GameResponse`](#gameresponse): A game response containing a new [`GameInstance`](#gameinstance-1) with updated values if the request was successful. Otherwise, the response will contain an error.

##### `postOptionCommand()`

Updates the values of the named game options in the game instance.

```ts
postOptionCommand(instance: GameInstance, options: Partial<GameOptions>): GameResponse;
```

**Parameters**

Parameter | Description
--- | ---
`instance: GameInstance` | The current game instance (will not be modified).
`options: Partial<GameOptions>` | The new option overrides, which must be allowed by the static configuration's `allowOverrides` option.

**Returns**

[`GameResponse`](#gameresponse): A game response containing a new [`GameInstance`](#gameinstance-1) with updated options if the request was successful. Otherwise, the response will contain an error.

### `GameApiExtended`

**_Interface_**

Extended API for interacting with the Regal game.

```ts
interface GameApiExtended extends GameApi {
    readonly isInitialized: boolean
    init(metadata: GameMetadata): void
    reset(): void
}
```

#### Description

Contains the standard methods from [`GameApi`](#gameapi) as well as additional methods for advanced control.

#### Extends

[`GameApi`](#gameapi)

#### Object Implementations

* [`Game`](#game)

#### Properties

Property | Value
--- | ---
`readonly isInitialized: boolean` | Whether `Game.init()` has been called.

#### Methods

##### `init()`

Initializes the game with the given metadata. This must be called before any game commands may be executed.

```ts
init(metadata: GameMetadata): void
```

**Properties**

Property | Value
--- | ---
`metadata: GameMetadata` | The game's configuration metadata.

##### `reset()`

Resets the game's static classes.

```ts
reset()
```

### `GameEventBuilder`

**_Type alias_**

Type alias for the [`on`](#on) function, which creates a [`TrackedEvent`](#trackedevent).

```ts
type GameEventBuilder<StateType = any> = (
    eventName: string,
    eventFunc: EventFunction<StateType>
) => TrackedEvent<StateType>
```

#### Description

Used for situations where the game developer wants to refer to a parameterized version of [`on`](#on) as its own function.

```ts
const o: GameEventBuilder<CustomStateType> = on;
```

For descriptions of the parameters and return value, see [`on`](#on).

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

### `GameInstance`

**_Interface_**

Represents a unique instance of a Regal game, containing the game's current state and all interfaces used to interact with the game during a game cycle.

```ts
interface GameInstance<StateType = any> {
    events: InstanceEvents
    output: InstanceOutput
    options: InstanceOptions
    random: InstanceRandom
    state: StateType
    using<T>(resource: T): T
}
```

#### Description

Instance state is a snapshot of a Regal game that is unique to a player, containing the modifications caused by all of the player's commands up to that point.

A game's static context is immutable data that is the same for every player regardless of their commands, whereas a `GameInstance` is the player's unique instance of the game.

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Properties

Property | Description
--- | ---
`events: InstanceEvents` | The manager for all events in the instance.
`output: InstanceOutput` | The manager for all output in the instance.
`options: InstanceOptions` | Read-only container for all current options in the instance.
`random: InstanceRandom` | The manager for generating repeatable random numbers through the game instance.
`state: StateType` | Free-form agent to contain any instance state desired by the game developer. Properties set within this object are maintained between game cycles, so it should be used to store long-term state.

#### Methods

##### `using()`

Activates one or more agents in the current game context. 

```ts
using<T>(resource: T): T
```

**Description**

All agents must be activated before they can be used. Activating an agent multiple times has no effect.

A single agent may be activated:

```ts
const agent = game.using(new CustomAgent());
```

Or, an array of agents:

```ts
const agents = game.using([ new CustomAgent(1), new CustomAgent(2) ]);
```

Or, an object where every property is an agent to be activated:

```ts
const { agent1, agent2 } = game.using({
    agent1: new CustomAgent(1),
    agent2: new CustomAgent(2)
});
```

**Generic Type Parameters**

Parameter | Description
--- | ---
`T` | The type of resource that is activated.

**Parameters**

Parameter | Description
--- | ---
`resource: T` | Either a single agent, an agent array, or an object where every property is an agent to be activated.

**Returns**

`T`: Either an activated agent, an agent array, or an object where every property is an activated agent, depending on the structure of `resource`.

### `GameMetadata`

**_Interface_**

Metadata about the game, such as its title and author.

```ts
interface GameMetadata {
    readonly name: string
    readonly author: string
    readonly headline?: string
    readonly description?: string
    readonly homepage?: string
    readonly repository?: string
    readonly options?: Partial<GameOptions>
    readonly regalVersion?: string
}
```

#### Description

Metadata values can be specified in the optional `regal.json` file or `regal` property of `package.json`, but are not required. If using `regal.json`, the metadata properties should be placed in an object with the key `game`.

```json
{
    "game": {
        "name": "My Regal Game",
        "author": "Joe Cowman",
        "options": {
            "debug": true
        }
    }
}
```

If any of the metadata properties `name`, `author`, `description`, `homepage`, or `repository` aren't specified, the values of each property with the same name in `package.json` will be used. `regalVersion` should not be specified, as it is set by the library automatically. If a value is passed for `regalVersion`, an error will be thrown.

A configuration loading tool like [**regal-bundler**](https://github.com/regal/regal-bundler) is needed if using `regal.json` or the `regal` property in `package.json`. Alternatively, metadata values can be passed explicitly via [`GameApiExtended.init()`](#init). Either way, a metadata object with at least the `name` and `author` properties specified is required before a game can receive commands.

This metadata is defined in the game's static context, meaning that it is the same for all instances of the game.

#### Properties

Property | Description
--- | ---
`readonly name: string` | The game's title.
`readonly author: string` | The game's author.
`readonly headline?: string` | The full description of the game.
`readonly homepage?: string` | The URL of the project's homepage.
`readonly repository?: string` | The URL of the project's repository.
`readonly options?: Partial<GameOptions>` | Any options overrides for the game.
`readonly regalVersion?: string` | The version of the Regal Game Library used by the game.

### `GameOptions`

**_Interface_**

Configurable options for the game's behavior.

```ts
interface GameOptions {
    readonly allowOverrides: string[] | boolean
    readonly debug: boolean
    readonly showMinor: boolean
    readonly trackAgentChanges: boolean
    readonly seed: string | undefined
}
```

#### Properties

Property | Description
--- | ---
`readonly allowOverrides: string[] | boolean` | Game options that can be overridden by a Regal client. Can be an array of strings or a boolean. Defaults to true. <br> If an array of strings, these options will be configurable by a Regal client. Note that `allowOverrides` is never configurable, and including it will throw an error. <br> If `true`, all options except `allowOverrides` will be configurable. If `false`, no options will be configurable.
`readonly debug: boolean` | Whether output of type `DEBUG` should be returned to the client. Defaults to false.
`readonly showMinor: boolean` | Whether output of type `MINOR` should be returned to the client. Defaults to true.
`readonly trackAgentChanges: boolean` | Whether all changes to agent properties are tracked and returned to the client. Defaults to false. <br> If `false`, only the values of each property at the beginning and end of each game cycle will be recorded. If `true`, all property changes will be recorded.
`readonly seed: string | undefined` | Optional string used to initialize pseudorandom number generation in each game instance. <br> When multiple instances have the same seed, they will generate the same sequence of random numbers through the `InstanceRandom` API. If left undefined, a random seed will be generated.

### `GameResponse`

**_Interface_**

Response object of every [`GameApi`](#gameapi) method, which contains some output and a [`GameInstance`](#gameinstance-1) if applicable.

```ts
interface GameResponse {
    instance?: GameInstance
    output: GameResponseOutput
}
```

#### Properties

Property | Description
--- | ---
`instance?: GameInstance` | The new instance state of the game. Will not be defined if an error occurred during the request or if [`getMetdataCommand`](#getmetadatacommand) was called.
`output: GameResponseOutput` | The output generated by the request, which will vary in structure depending on the request and if it was successful.

### `GameResponseOutput`

**_Interface_**

The output component of a response generated by a request to the `GameApi`.

```ts
interface GameResponseOutput {
    wasSuccessful: boolean
    error?: RegalError
    log?: OutputLine[]
    metadata?: GameMetadata
}
```

#### Properties

Property | Description
--- | ---
`wasSuccessful: boolean` | Whether the request was executed successfully.
`error?: RegalError` | The error that was thrown if `wasSuccessful` is false.
`log?: OutputLine[]` | Contains any lines of output emitted because of the request.
`metadata?: GameMetadata` | Contains the game's metadata if `getMetdataCommand` was called.

### `InstanceEvents`

### `InstanceOptions`

### `InstanceOutput`

### `InstanceRandom`

### `OutputLine`

### `OutputLineType`

### `RegalError`

### `TrackedEvent`

### `enqueue`

### `noop`

### `nq`

### `on`

### `onBeforeUndoCommand`

### `onPlayerCommand`

### `onStartCommand`

## Contributing

Created by Joe Cowman ([jcowman2](https://github.com/jcowman2)).

If you would like to get involved, please see the project's [about](https://github.com/regal/about) page.

## Project Roadmap

*Copyright 2018, Joe Cowman*
