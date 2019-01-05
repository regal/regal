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

Before an agent's properties can be accessed in a game cycle, the agent must be activated with [`GameInstance.using`](#gameinstance-1). If you try to read or modify the property of an agent that hasn't been activated, a `RegalError` will be thrown.

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
    EXPANDED_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+{}[]|;:<>,.?",
    ALHPANUMERIC_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    ALPHABET_CHARSET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
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
) => EventFunction<StateType> | void;
```

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
enqueue(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;
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
nq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;
```

### `Game`

### `GameApi`

### `GameApiExtended`

### `GameEventBuilder`

### `GameInstance`

### `GameMetadata`

### `GameOptions`

### `GameResponse`

### `GameResponseOutput`

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
