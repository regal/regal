# Regal

[![npm version](https://badge.fury.io/js/regal.svg)](https://badge.fury.io/js/regal)
[![CircleCI](https://circleci.com/gh/regal/regal.svg?style=svg)](https://circleci.com/gh/regal/regal)
[![Coverage Status](https://coveralls.io/repos/github/regal/regal/badge.svg?branch=master)](https://coveralls.io/github/regal/regal?branch=master)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

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
* [Project Roadmap](#project-roadmap)
* [Contributing](#contributing)
* [Guide: Creating Your First Regal Game](#guide-creating-your-first-regal-game)
* [Documentation](#documentation)
    * [Core Concepts](#core-concepts)
    * [`GameInstance`](#gameinstance)
    * [Events](#events)
    * [Agents](#agents)
    * [Randomness](#randomness)
    * [Output](#output)
    * [`GameApi` and API Hooks](#gameapi-and-api-hooks)
    * [Configuration](#configuration)
    * [Bundling](#bundling)
* [API Reference](#api-reference)

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

## Project Roadmap

The Regal Game Library has been in development since June 2018. The first stable version, alias **Beacon**, was released on February 1st, 2019.

Regal `2.0.0`, alias **Dakota**, was released on November 11th, 2019. This version included some sweeping refactors that fixed bugs in the initial release, namely adding the [Agent Prototype Registry](https://github.com/regal/regal/issues/104) to support class methods for Agents.

Moving forward, the most pressing features that should be added to the Game Library are the [player command](https://github.com/regal/regal/issues/86) and [plugin](https://github.com/regal/regal/issues/96) interfaces.

Outside of the library, other priorities include:
* Improving the development tooling surrounding the framework, such as expanding [**regal-bundler**](https://github.com/regal/regal-bundler) and creating a CLI.
* Building clients to play Regal games on various platforms.
* Creating fun Regal games.

## Contributing

Currently, the Regal Framework is developed solely by Joe Cowman ([jcowman2](https://github.com/jcowman2)), but pull requests, bug reports, suggestions, and questions are all more than welcome! 

If you would like to get involved, please see [the contributing page](https://github.com/regal/regal/blob/master/CONTRIBUTING.md) or the project's [about page](https://github.com/regal/about).

## Guide: Creating Your First Regal Game

The following is a step-by-step guide for creating a basic game of *Rock, Paper, Scissors* with Regal and TypeScript. 

For more detailed information on any topic, see the [API Reference](#api-reference) below. Everything in this guide is available in the Regal [**demos**](https://github.com/regal/demos/tree/master/my-first-game) repository as well.

### Step 1. Set up project

Start with an empty folder. Create a `package.json` file in your project's root directory with at least the following properties:

```json
{
    "name": "my-first-game",
    "author": "Your Name Here"
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

You can use the [**Regal CLI**](https://github.com/regal/regal-cli) to create Regal game bundles from the command line. Install it like so:

```
npm install -g regal-cli regal
```

To bundle your game, execute this command in your project's root directory:

```
regal bundle
```

This should generate a new file in your project's directory, called `my-first-game.regal.js`. *Your first game is bundled and ready to be played!*

For a list of configuration options you can use, consult the CLI's [documentation](https://github.com/regal/regal-cli/#bundle).

### Step 4. Play game

To load a Regal game bundle for playing, use the [**Regal CLI**](https://github.com/regal/regal-cli) `play` command.

```
regal play my-first-game.regal.js
```

The game should open in your terminal. Enter `rock`, `paper`, or `scissors` to play, or `:quit` to exit the game. The sequence should look something like this:

```
Now Playing: my-first-game by Your Name Here
Type :quit to exit the game.

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
* They are **deterministic**. When a Regal game is given some input, it should return the same output every time. (*To see how this applies to random values, read [here](#deterministic-randomness).*)

These two qualities allow Regal games to be thought of as **pure functions**. A *pure function* is a function that is deterministic and has no side-effects. In other words, a Regal game is totally self-contained and predictable.

Think of playing a Regal game like the following equation:
```
g1(x) = g2

where x is the player's command
g1 is the Regal game before the command
g2 is the Regal game after the command
```

Entering the player's command into the first **game instance** creates another **game instance** with the effects of the player's command applied. For example, if `g1` contains a scene where a player is fighting an orc, and `x` is `"stab orc"`, `g2` might show the player killing that orc. Note that `g1` is unmodified by the player's command.

The process of one game instance interpreting a command and outputting another game instance is called a **game cycle**.

#### Game Data

All data in a Regal game is in one of two forms: **static** or **instance-specific**.

*Static data* is defined in the game's source code, and is the same for every instance of the game. Game events, for example, are considered static because they are defined the same way for everyone playing the game (even though they may have different effects). Metadata values for the game, such as its title and author, are also static.

*Instance-specific* data, more frequently called *game state*, is unique to a single [instance](#gameinstance) of the game. A common example of game state is a player's stats, such as health or experience. Because this data is unique to one player of the game and is not shared by all players, it's considered instance-specific.

Understanding the difference between static data and game state is important. Everything that's declared in a Regal game will be in one of these two contexts.

### `GameInstance`

The cornerstone of the Regal Game Library is the [`GameInstance`](#gameinstance-1).

A [`GameInstance`](#gameinstance-1) represents a unique instance of a Regal game. It contains [**(1)**](#instance-state) the game's current state and [**(2)**](#instancex-interfaces) all the interfaces used to interact with the game during a game cycle.

#### GameInstance vs Game

To understand how a *game instance* differs from the game itself, it can be helpful to think of a Regal game like a class. The game's static context is like a class definition, which contains all the immutable events and constants that are the same for every player.

When a player starts a new Regal game, they receive an object of that class. This **game instance** is a snapshot of the Regal game that is unique to that player. It contains the effects of every command made by the player, and has no bearing on any other players' game instances.

> Two people playing different games of Solitare are playing the same *game*, but different *game instances*.

#### Instance State

All game state is stored in a [`GameInstance`](#gameinstance-1) object. Some of this state is hidden from view, but custom properties can be set directly in `GameInstance.state`.

```ts
// Assumes there's a GameInstance called myGame
myGame.state.foo = "bar";
myGame.state.arr = [1, 2, 3];
```

Properties set within the `state` object are maintained between game cycles, so it can be used to store game data long-term.

`GameInstance.state` is of of type `any`, meaning that its properties are totally customizable. Optionally, the state type may be set using a type parameter (*see [Using StateType](#using-statetype) for more information*).

#### InstanceX Interfaces

In addition to storing game state, [`GameInstance`](#gameinstance-1) contains several interfaces for controlling the game instance's behavior.

Property | Type | Controls
--- | --- | ---
`events` | [`InstanceEvents`](#instanceevents) | [Events](#events)
`output` | [`InstanceOutput`](#instanceoutput) | [Output](#output)
`options` | [`InstanceOptions`](#instanceoptions) | [Options](#configuration)
`random` | [`InstanceRandom`](#instancerandom) | [Randomness](#randomness)
`state` | `any` or [`StateType`](#using-statetype) | [Miscellaneous state](#instance-state)

Each of these interfaces is described in more detail below.

#### Using `StateType`

`GameInstance.state` is of of type `any`, meaning that its properties are totally customizable. Optionally, the state type may be set using a type parameter called `StateType`.

The `StateType` parameter allows you to type-check the structure of `GameInstance.state` against a custom interface anywhere [`GameInstance`](#gameinstance-1) is used.

```ts
interface MyState {
    foo: boolean;
}

(myGame: GameInstance<MyState>) => {
    const a = myGame.state.foo; // Compiles
    const b = myGame.state.bar; // Won't compile!
};
```

Keep in mind that `StateType` is strictly a compile-time check, and no steps are taken to ensure that the `state` object actually matches the structure of `StateType` at runtime.

```ts
(myGame: GameInstance<string>) => myGame.state.substring(2); // Compiles fine, but will throw an error at runtime because state is an object.
```

`StateType` is especially useful for [parameterizing events](#parameterizing-events).

### Events

A game where everything stays the same isn't much of a game. Therefore, Regal games are powered by **events**.

An *event* can be thought of as anything that happens when someone plays a Regal game. Any time the game's state changes, it happens inside of an event.

#### Event Functions

Events in the Regal Game Library share a common type: [`EventFunction`](#eventfunction).

An [`EventFunction`](#eventfunction) takes a [`GameInstance`](#gameinstance-1) as its only argument, modifies it, and may return the next [`EventFunction`](#eventfunction) to be executed, if one exists.

Here is a simplified declaration of the [`EventFunction`](#eventfunction) type:

```ts
type EventFunction = (game: GameInstance) => EventFunction | void;
```

An [`EventFunction`](#eventfunction) can be invoked by passing it a [`GameInstance`](#gameinstance-1):

```ts
// Assumes there's a GameInstance called myGame 
// and an EventFunction called event1, which returns void.

event1(myGame); // Invoke the event.

// Now, myGame contains the changes made by event1.
```

[`EventFunction`](#eventfunction) has two subtypes: [`TrackedEvent`](#trackedevent) and [`EventQueue`](#eventqueue). Both are described below.

#### Declaring Events

The most common type of event used in Regal games is the [`TrackedEvent`](#trackedevent). A [`TrackedEvent`](#trackedevent) is simply an [`EventFunction`](#eventfunction) that is tracked by the [`GameInstance`](#gameinstance-1).

> In order for Regal to work properly, all modifications to game state should take place inside tracked events.

To declare a [`TrackedEvent`](#trackedevent), use the [`on`](#on) function:

```ts
import { on } from "regal";

const greet = on("GREET", game => {
    game.output.write("Hello, world!");
});
```

The [`on`](#on) function takes an *event name* and an *event function* to construct a [`TrackedEvent`](#trackedevent). The event declared above could be invoked like this:

```ts
// Assumes there's a GameInstance called myGame.

greet(myGame); // Invoke the greet event.
```

This would cause `myGame` to have the following output:

```
GREET: Hello, world!
```

#### Causing Additional Events

As stated earlier, an [`EventFunction`](#eventfunction) may return another [`EventFunction`](#eventfunction). This tells the event executor that another event should be executed on the game instance.

Here's an example:

```ts
const day = on("DAY", game => {
    game.output.write("The sun shines brightly overhead.");
});

const night = on("NIGHT", game => {
    game.output.write("The moon glows softly overhead.");
});

const outside = on("OUTSIDE", game => {
    game.output.write("You go outside.");
    return game.state.isDay ? day : night;
});
```

When the `outside` event is executed, it checks the value of `game.state.isDay` and returns the appropriate event to be executed next.

```ts
// Assume that myGame.state.isDay is false.

outside(myGame);
```

`myGame`'s output would look like this:

```
OUTSIDE: You go outside.
NIGHT: The moon glows softly overhead.
```

#### Causing Multiple Events

It's possible to have one [`EventFunction`](#eventfunction) cause multiple events with the use of an [`EventQueue`](#eventqueue).

An [`EventQueue`](#eventqueue) is a special type of [`TrackedEvent`](#trackedevent) that contains a collection of events. These events are executed sequentially when the [`EventQueue`](#eventqueue) is invoked.

Queued events may be [**immediate**](#immediate-execution) or [**delayed**](#delayed-execution), depending on when you want them to be executed.

#### Immediate Execution

To have one event be executed immediately after another, use the [`TrackedEvent.then()`](#then) method. This is useful in situations where multiple events should be executed in direct sequence.

To demonstrate, here's an example of a player crafting a sword. When the `makeSword` event is executed, the sword is immediately added to the player's inventory (`addItemToInventory`) and the player learns the blacksmithing skill (`learnSkill`).

```ts
const learnSkill = (name: string, skill: string) =>
    on(`LEARN SKILL <${skill}>`, game => {
        game.output.write(`${name} learned ${skill}!`);
    });

const addItemToInventory = (name: string, item: string) =>
    on(`ADD ITEM <${item}>`, game => {
        game.output.write(`Added ${item} to ${name}'s inventory.`);
    });

const makeSword = (name: string) =>
    on(`MAKE SWORD`, game => {
        game.output.write(`${name} made a sword!`);
        return learnSkill(name, "Blacksmithing")
            .then(addItemToInventory(name, "Sword"));
    });
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/immediate-execution.ts).*

Execute the `makeSword` event on a [`GameInstance`](#gameinstance-1) called `myGame` like so:

```ts
makeSword("King Arthur")(myGame);
```

This would produce the following output for `myGame`:

```
MAKE SWORD: King Arthur made a sword!
ADD ITEM <Sword>: Added Sword to King Arthur's inventory.
LEARN SKILL <Blacksmithing>: King Arthur learned Blacksmithing!
```

#### Delayed Execution

Alternatively, an event may be scheduled to execute only after all of the immediate events are finished by using [`enqueue()`](#enqueue-1). This is useful in situations where you have multiple series of events, and you want each series to execute their events in the same "round."

This is best illustrated with an example. Here's a situation where a player executes a command that drops a list of items from their inventory.

```ts
import { on, enqueue } from "regal";

const hitGround = (item: string) =>
    on(`HIT GROUND <${item}>`, game => {
        game.output.write(`${item} hits the ground. Thud!`);
    });

const fall = (item: string) =>
    on(`FALL <${item}>`, game => {
        game.output.write(`${item} falls.`);
        return enqueue(hitGround(item));
    });

const drop = on("DROP ITEMS", game => {
        let q = enqueue();
        for (let item of game.state.items) {
            q = q.enqueue(fall(item));
        }
        return q;
    });
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/delayed-exeuction.ts).*

We'll walk through each line, starting from the `drop` function.

```ts
const drop = on("DROP ITEMS", game => {
```

The [`enqueue()`](#enqueue-1) function takes zero or more [`TrackedEvent`](#trackedevent)s as arguments, which it uses to build an [`EventQueue`](#eventqueue). Creating an empty queue has no effect; it simply provides us a reference to which we can add additional events.

```ts
let q = enqueue();
```

In addition to being a standalone function, [`enqueue()`](#enqueue) is also a method of [`EventQueue`](#eventqueue). Calling [`EventQueue.enqueue()`](#enqueue) creates a new queue with all previous events plus the new event(s).

```ts
for (let item of game.state.items) {
    q = q.enqueue(fall(item));
}
```

The previous two code blocks could be simplified by using JavaScript's `map` like so:

```ts
const q = enqueue(game.state.items.map(item => fall(item)));
```

Finally, we return the event queue.

```ts
        return q;
    });
```

The `fall` event is simpler. It outputs a message and adds a `hitGround` event to the end of the queue for a single item.

```ts
const fall = (item: string) =>
    on(`FALL <${item}>`, game => {
        game.output.write(`${item} falls.`);
        return enqueue(hitGround(item));
    });
```

The `hitGround` event outputs a final message.

```ts
const hitGround = (item: string) =>
    on(`HIT GROUND <${item}>`, game => {
        game.output.write(`${item} hits the ground. Thud!`);
    });
```

Deciding that `game.state.items` contains `["Hat", "Duck", "Spoon"]`, executing the `drop` event would produce an output like this:

```
FALL <Hat>: Hat falls.
FALL <Duck>: Duck falls.
FALL <Spoon>: Spoon falls.
HIT GROUND <Hat>: Hat hits the ground. Thud!
HIT GROUND <Duck>: Duck hits the ground. Thud!
HIT GROUND <Spoon>: Spoon hits the ground. Thud!
```

If you're still confused about the difference between [`TrackedEvent.then()`](#then) and [`EventQueue.enqueue()`](#enqueue), here's what the output would have been if [`TrackedEvent.then()`](#then) was used instead:

```
FALL <Hat>: Hat falls.
HIT GROUND <Hat>: Hat hits the ground. Thud!
FALL <Duck>: Duck falls.
HIT GROUND <Duck>: Duck hits the ground. Thud!
FALL <Spoon>: Spoon falls.
HIT GROUND <Spoon>: Spoon hits the ground. Thud!
```

Remember, [`enqueue()`](#enqueue-1) is useful for situations where you have multiple series of events, like our [`fall` -> `hitGround`] series, and you want each series to execute their alike events in the same "round." We didn't want `hat` to finish hitting the ground before `duck` fell, we wanted all of the items to fall *together* and hit the ground *together*.

> [`TrackedEvent.then()`](#then) is for immediate exeuction and [`enqueue()`](#enqueue-1) is for delayed exeuction.

#### Event Chains

The event API is chainable, meaning that the queueing methods can be called multiple times to create more complex event chains.

```ts
// Immediately executes events 1-4
event1.then(event2, event3, event4);
event1.then(event2).then(event3).then(event4);
event1.then(event2.then(event3, event4));
event1.then(event2, event3.then(event4));

// Immediately executes event1, delays 2-4.
event1.then(enqueue(event2, event3, event4));
event1.thenq(event2, event3, event4); // TrackedEvent.thenq is shorthand for TrackedEvent.then(enqueue(...))

// Immediately executes events 1-2, delays 3-4.
event1.then(event2).enqueue(event3, event4);
event1.then(event2, enqueue(event3, event4));
event1.then(event2).enqueue(event3).enqueue(event4);

// Delays events 1-4.
enqueue(event1, event2, event3, event4);
enqueue(event1.then(event2, event3, event4));
```

If you prefer, you can use the shorthand [`nq`](#nq-1) instead of writing [`enqueue()`](#enqueue-1). We're all about efficiency. :+1:

```ts
import { nq } from "regal";

let q = nq(event1, event2);
q = q.nq(event3);
```

When creating event chains, keep in mind that all immediate events must be added to the queue **before** delayed events.

```ts
event1.then(nq(event2, event3), event4); // ERROR
event1.then(event4, nq(event2, event3)); // Okay
```

For more information, consult the [API Reference](#api-reference).

#### When to Use `noop`

[`noop`](#noop) is a special [`TrackedEvent`](#trackedevent) that stands for *no operation*. When the event executor runs into [`noop`](#noop), it ignores it.

```ts
import { on, noop } from "regal";

const end = on("END", game => {
    game.output.write("The end!");
    return noop; // Nothing will happen
});
```

[`EventFunction`](#eventfunction) doesn't have a required return, so most of the time you can just return nothing instead of returning [`noop`](#noop).

```ts
const end = on("END", game => {
    game.output.write("The end!");
});
```

However, [`noop`](#noop) might be necessary in cases where you want to use a ternary to make things simpler:

```ts
on("EVENT", game => 
    // Return another event to be executed if some condition holds, otherwise stop.
    game.state.someCondition ? otherEvent | noop; 
);
```

If you have a TypeScript project with [`noImplicitReturns`](https://www.typescriptlang.org/docs/handbook/compiler-options.html) enabled, [`noop`](#noop) is useful for making sure all code paths return a value.

```ts
// Error: [ts] Not all code paths return a value.
on("EVENT", game => {
    if (game.state.someCondition) {
        return otherEvent;
    }
});

// Will work as intended
on("EVENT", game => {
    if (game.state.someCondition) {
        return otherEvent;
    }
    return noop;
});
```

#### Parameterizing Events

The [`StateType`](#using-statetype) type parameter of [`GameInstance`](#gameinstance-1) can be used to declare the type of `GameInstance.state` inside the scope of individual events.

[`EventFunction`](#eventfunction), [`TrackedEvent`](#trackedevent), and [`EventQueue`](#eventqueue) all allow an optional type parameter that, if used, will type-check `GameInstance.state` inside the body of the event.

```ts
import { on } from "regal";

interface MyState {
    num: number;
    names: string[];
}

const init = on<MyState>("INIT", game => {
    game.state.num = 0; // Type checked!
    game.state.names = ["spot", "buddy", "lucky"]; // Type checked!
});

const pick = on<MyState>("PICK", game => {
    const choice = game.state.names[game.state.num]; // Type checked!
    game.output.write(`You picked ${choice}!`);
    game.state.num++; // Type checked!
});
```

Including the type parameter for every event gets unwieldy for games with many events, so the type [`GameEventBuilder`](#gameeventbuilder) can be used to alias a customized [`on`](#on).

```ts
import { on as _on, GameEventBuilder } from "regal";

interface MyState {
    num: number;
    names: string[];
}

const on: GameEventBuilder<MyState> = _on; // Declare `on` as our parameterized version

const init = on("INIT", game => {
    game.state.num = 0; // Type checked!
    game.state.names = ["spot", "buddy", "lucky"]; // Type checked!
});

const pick = on("PICK", game => {
    const choice = game.state.names[game.state.num]; // Type checked!
    game.output.write(`You picked ${choice}!`);
    game.state.num++; // Type checked!
});
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/statetype-and-arrays.ts).*

Using the redefined [`on`](#on) from this example, the following event would not compile:

```ts
on("BAD", game => {
    game.state.nams = []; // Error: [ts] Property 'nams' does not exist on type 'MyState'. Did you mean 'names'?
});
```

### Agents

Where [events](#events) describe any change that occurs within a Regal game, **agents** are the objects on which these changes take place.

Every object that contains game state (like players, items, and score) is considered an agent.

#### Defining Agents

The Regal Game Library offers the [`Agent`](#agent) class, which you can extend to create custom agents for your game.

Here is an example:

```ts
import { Agent } from "regal";

class Bucket extends Agent {
    constructor(
        public size: number,
        public contents: string,
        public isFull: boolean
    ) {
        super();
    }
}
```

Now, a `Bucket` can be instantiated and used just like any other class.

```ts
const bucket = new Bucket(5, "water", true);
bucket.size === 5; // True
```

Furthermore, you can use them in events.

```ts
const init = on("INIT", game => {
    game.state.bucket = new Bucket(5, "famous chili", true);
});

const pour = on("POUR", game => {
    const bucket: Bucket = game.state.bucket;

    if (bucket.isFull) {
        bucket.isFull = false;
        game.output.write(`You pour out the ${bucket.contents}.`);
    } else {
        game.output.write("The bucket is already empty!");
    }
});
```

Executing `init.then(pour, pour)` on a game instance would give the following output:

```
POUR: You pour out the famous chili.
POUR: The bucket is already empty!
```

*Note: this example is available [here](https://github.com/regal/demos/blob/master/snippets/src/defining-agents.ts).*

#### Active and Inactive Agents

Agents have a single caveat that may seem strange at first, but is important to understand:

> Before an agent's properties can be accessed in a game cycle, the **agent must first be activated**. 

To *activate* an agent simply means to register it with the [`GameInstance`](#gameinstance-1). Much like how all changes to game state need to take place inside tracked *events*, the *agents* that contain this state need to be tracked as well.

Activating an agent allows it to be tracked by the [`GameInstance`](#gameinstance-1), and can happen either [_**implicitly**_](#activating-agents-implicitly) or [_**explicitly**_](#activating-agents-explicitly). 

If you try to modify an inactive agent within a game cycle, a [`RegalError`](#regalerror) will be thrown. For example:

```ts
const illegalEvent = on("EVENT", game => {
    const waterBucket = new Bucket(1, "water", true); // Create an inactive agent
    waterBucket.isFull = false; // Uh-oh!
});
```

Executing `illegalEvent` will throw the following error:

```
RegalError: The properties of an inactive agent cannot be set within a game cycle.
```

*Note: this example is available [here](https://github.com/regal/demos/blob/master/snippets/src/illegal-agent-use.ts).*

#### Activating Agents Implicitly

Most of the time, agents will activate themselves without you having to do any extra work. In fact, you've already seen an example of this with the `Bucket` agent [above](#defining-agents).

One of the ways that agents may be activated *implicitly* is by setting them as a property of an already-active agent.

```ts
const init = on("INIT", game => {
    game.state.bucket = new Bucket(5, "famous chili", true);
});
```

When our new `Bucket` agent was assigned to the game instance's `state.bucket` property, it was activated implicitly. This is because **`GameInstance.state` is actually an active agent**.

> Whenever agents are set as properties of `GameInstance.state`, they are activated implicitly.

There are five ways to activate agents implicitly. The first way, which was demonstrated above, is to set the agent as a property of an active agent.

```ts
class Parent extends Agent {
    constructor(
        public num: number, 
        public child?: Agent // Optional child property
    ) {
        super();
    }
}

game.state.myAgent = new Parent(1); // #1 is activated by GameInstance.state
game.state.myAgent.child = new Parent(2); // #2 is activated by #1
```

Second, all agents that are properties of an inactive agent are activated when the parent agent is activated.

```ts
const p = new Parent(1, new Parent(2)); // #1 and #2 are both inactive
game.state.myAgent = p; // #1 and #2 are activated by GameInstance.state
```

Third, all agents in arrays that are properties of an inactive agent are activated when the parent agent is activated.

```ts
class MultiParent extends Agent {
    constructor(
        public num: number,
        public children: Agent[] = [] // Default to an empty array
    ) {
        super();
    }
}

const mp = new MultiParent(1, [ new Parent(2), new Parent(3) ]); // #1, #2, and #3 are inactive
game.state.myAgent = mp; // #1, #2, and #3 are activated by GameInstance.state
```

Fourth, all agents in an array are activated when it is set as the property of an already-active agent.

```ts
game.state.myAgent = new MultiParent(1); // #1 is activated by GameInstance.state
game.state.myAgent.children = [ new Parent(2), new Parent(3) ]; // #2 and #3 are activated by #1
```

Finally, an agent is activated when it is added to an array that's a property of an already-active agent.

```ts
game.state.myAgent = new MultiParent(1, [ new Parent(2) ]); // #1 and #2 are activated by GameInstance.state
game.state.myAgent.children.push(new Parent(3)); // #3 is activated by #1
```

*Note: this example is available [here](https://github.com/regal/demos/blob/master/snippets/src/implicit-activation.ts).*

#### Activating Agents Explicitly

Agents can be activated *explicitly* with [`GameInstance.using()`](#using).

[`GameInstance.using()`](#using) activates one or more agents and returns references to them. The method takes a single argument, which can be one of a few types.

First, a single agent may be activated.

```ts
class CustomAgent extends Agent {
    constructor(public num: number) {
        super();
    }
}

const agent = game.using(new CustomAgent(1)); // #1 is activated
```

Second, an array of agents may be activated:

```ts
const agents = game.using([ new CustomAgent(1), new CustomAgent(2) ]); // #1 and #2 are activated
```

Finally, the argument can be an object where every property is an agent to be activated:

```ts
const { agent1, agent2 } = game.using({
    agent1: new CustomAgent(1),
    agent2: new CustomAgent(2)
}); // #1 and #2 are activated
```

*Note: this example is available [here](https://github.com/regal/demos/blob/master/snippets/src/explicit-activation.ts).*

Explicit activation is useful for situations where agents aren't being activated implicitly. If you can't figure out whether an agent is getting activated implicitly or not, you may want to explicitly use [`GameInstance.using()`](#using) just to be safe. Activating an agent multiple times has no effect.

#### Modifying Inactive Agents

Inactive agents aren't truly immutable. In fact, any property of an inactive agent may be *set once* before the agent is activated. Otherwise, setting properties within constructors wouldn't be possible.

Technically, this means doing something like this is valid (although not recommended):

```ts
const a = new CustomAgent(1);
(a as any).someOtherProperty = "foo";
game.state.myAgent = a;
```

It's important to note that the properties of inactive agents are only inaccessible within the context of a game cycle (i.e. inside a [`TrackedEvent`](#trackedevent)). When agents are declared outside of events, they are called [**static agents**](#static-agents) and have special characteristics. These are explained in the next section.

#### Static Agents

All Regal [**game data**](#game-data) is considered either *static* or *instance-specific*. The agents we've created up to this point have all been instance-specific, meaning that they are defined inside events and their data is stored in the instance state.

Although it's perfectly valid to store every agent in the instance state, this usually isn't necessary. Most games have a lot of data that is rarely, or never, modified. Rather than storing this data in every [`GameInstance`](#game-instance-1), it's more efficient to store these agents in the game's *static* context. Remember, static data is defined *outside* the game cycle and is separate from the instance state. 

> **Static agents** are agents defined outside of the game cycle. 

Once activated, static agents can be used inside events just like non-static agents.

```ts
// Declare a new agent class called Book
class Book extends Agent {
    constructor(
        public title: string,
        public author: string,
        public content: string
    ) {
        super();
    }
}

// Declare a static Book agent
const NOVEL = new Book(
    "Frankenstein",
    "Mary Shelley",
    /* really long string */ 
);

const read = on("READ", game => {
    const novel = game.using(NOVEL); // Activate the static agent
    game.output.write(`You open ${novel.title}, by ${novel.author}.`);

    const excerpt = novel.content.split(" ").slice(0, 4).join(" "); // Grab the first 4 words
    game.output.write(`It begins, "${excerpt}..."`);
});
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/static-agents.ts).*

Executing `read` on a [`GameInstance`](#gameinstance-1) would produce the following output:

```
READ: You open Frankenstein, by Mary Shelley.
READ: It begins, "To Mrs. Saville, England..."
```

Unlike non-static agents, static agents may have their properties read or modified, but only outside of the game cycle. For example, this would be okay:

```ts
const NOVEL = new Book(
    "Frankenstein",
    "Mary Shelley",
    /* really long string */ 
);

NOVEL.title += ", or The Modern Prometheus"; // No error!
```

In order to use a static agent's properties *within* a game cycle, however, it must be activated. 

This event modifies several properties of the `NOVEL` static agent:

```ts
const revise = (playerName: string, forward: string) =>
    on("REVISE", game => {
        const novel = game.using(NOVEL);
        novel.content = forward + " " + novel.content;
        novel.author += ` (with a forward by ${playerName})`
    });
```

Executing the queue `revise("Lars", "Pancakes!").then(read)` on a [`GameInstance`](#game-instance-1) would produce the following output:

```
READ: You open Frankenstein, by Mary Shelley (with a forward by Lars).
READ: It begins, "Pancakes! To Mrs. Saville,..."
```

Both events, `read` and `revise`, activated `NOVEL` independently of each other, yet the changes made in `revise` were still there in `read`. This is because the *changes* made to static agents are stored in the instance state. The static agent's properties that weren't changed (in this case, just the author) don't need to be stored in the state.

> Static agents save space by storing **only the changes** made to their properties by a specific game instance in that instance's state. 

If two different game instances reference the same static agent, their changes will not affect each other. This is because changes made to a static agent don't actually modify the static agent at all; they are simply stored in the instance state.

### Randomness

Randomness is an essential part of many games, so the Regal Game Library provides a convenient way to generate random values through the [`GameInstance`](#gameinstance-1).

#### Generating Random Values

`GameInstance.random` contains an object of type [`InstanceRandom`](#instancerandom), which is an interface for generating random values.

[`InstanceRandom`](#instancerandom) has methods for generating random integers, decimals, strings, and booleans.

```ts
const randos = on("RANDOS", game => {
    const bool = game.random.boolean(); // Either true or false
    game.output.write(`Boolean -> ${bool}`);

    const int = game.random.int(1, 10); // Integer between 1 and 10, inclusive
    game.output.write(`Int -> ${int}`);

    const dec = game.random.decimal(); // Random decimal betweeen 0 and 1
    game.output.write(`Decimal -> ${dec}`); 

    const str = game.random.string(10); // Random string of length 10
    game.output.write(`String -> ${str}`);
});
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/random.ts).*

Executing `randos` on a [`GameInstance`](#gameinstance-1) would produce values like the following:

```
RANDOS: Boolean -> true
RANDOS: Int -> 5
RANDOS: Decimal -> 0.38769409744713784
RANDOS: String -> qj$4d-28DX
```

[`InstanceRandom.string()`](#string) has an optional `charset` property that can be used to specify the characters that are chosen from when the string is generated.

For example, if `charset` is `"aeiou"`, then the random string will only contain vowels.

[`Charsets`](#charsets) is a static object that contains several common charset strings for this purpose.

```ts
import { Charsets } from "regal";

const rstrings = on("RSTRINGS", game => {
    const alphanumeric = game.random.string(10, Charsets.ALHPANUMERIC_CHARSET);
    game.output.write(`Alphanumeric -> ${alphanumeric}`);

    const alphabet = game.random.string(10, Charsets.ALPHABET_CHARSET);
    game.output.write(`Alphabet -> ${alphabet}`);

    const numbers = game.random.string(10, Charsets.NUMBERS_CHARSET);
    game.output.write(`Numbers -> ${numbers}`);

    const hex = game.random.string(10, Charsets.NUMBERS_CHARSET + "ABCDEF");
    game.output.write(`Hex -> ${hex}`);

    const binary = game.random.string(10, "10");
    game.output.write(`Binary -> ${binary}`);

    game.output.write(`Old MacDonald had a farm, ${game.random.string(5, "eio")}.`);
});
```

Executing `rstrings` on a [`GameInstance`](#gameinstance-1) would produce values like the following:

```
RSTRINGS: Alphanumeric -> AEeLn85uLT
RSTRINGS: Alphabet -> RoGfYDtwcL
RSTRINGS: Numbers -> 2132069253
RSTRINGS: Hex -> 69072CF9B5
RSTRINGS: Binary -> 1111011001
RSTRINGS: Old MacDonald had a farm, oeioe.
```

[`InstanceRandom.choice()`](#choice) chooses a random element from an array without modifying anything. This works with arrays of primitives or agents.

```ts
class Item extends Agent {
    constructor(public name: string) {
        super();
    }
}

const init = on("INIT", game => {
    game.state.items = [
        new Item("Yo-Yo"),
        new Item("Pigeon"),
        new Item("Corn cob")
    ];
});

const rpick = on("RPICK", game => {
    const i: Item = game.random.choice(game.state.items);
    game.output.write(`You picked the ${i.name}!`);
});
```

Executing `init.then(rpick, rpick, rpick)` on a [`GameInstance`](#gameinstance-1) would produce values like the following:

```
RPICK: You picked the Pigeon!
RPICK: You picked the Yo-Yo!
RPICK: You picked the Pigeon!
```

#### Deterministic Randomness

Regal games are by definition *deterministic*, meaning that they always return the same output when given the same input. The methods for generating random values described above might seem to disobey this principle, but they do not.

When a [`GameInstance`](#gameinstance-1) is created, it is given a special value called a *seed*. This seed value initializes the game instance's internal random number generator and has a direct influence on all random values that come out of it.

The seed value may be set manually as a [configuration option](#configuring-game-options). If no seed is set, one will be generated randomly at runtime.

A game instance's seed is considered part of its input. Therefore, it plays a factor in determining the game's output. If two game instances have the same seed, they will generate the exact same sequence of random values. If a [`GameInstance`](#gameinstance-1) is reset with an [undo command](#postUndoCommand), then its random value stream will be reset as well.

In order for Regal to work properly, all random values should be generated by [InstanceRandom](#instancerandom). JavaScript's `Math.Random()` or other libraries for generating random values are **not recommended**.

### Output

Up to this point, you've probably noticed the other examples calling `game.output.write()` to send messages to the game's output. [`write()`](#write) is one of several methods provided by [`InstanceOutput`](#instanceoutput), the interface for controlling and emitting output through the [`GameInstance`](#gameinstance-1).

[`InstanceOutput`](#instanceoutput) is accessible through `GameInstance.output`.

Output is handled line-by-line. An [`OutputLine`](#outputline) is modeled as a text string (`data`) with a property that specifies its semantic meaning (`type`). These types, which are stored as an enum called [`OutputLineType`](#outputlinetype), include `NORMAL`, `MAJOR`, `MINOR`, `DEBUG`, and `SECTION_TITLE`.

[`InstanceOutput`](#instanceoutput) contains a method for emitting each of these types of output.

```ts
const out = on("OUT", game => {
    game.output.writeNormal("This is normal output. Most of your game's output will be this type.");
    game.output.write("InstanceOutput.write is just a shorthand for writeNormal!");

    game.output.writeMajor("This is major output. Save this for really important stuff.");

    game.output.writeMinor("This is minor output. Use this for repetitive/flavor text that isn't necessary for the player to see.");

    game.output.writeDebug("This is debug output. It's only visible when the debug option is enabled.")

    game.output.writeTitle("This is a title.");
});
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/src/outputs.ts).*

Executing the `out` event on a [`GameInstance`](#gameinstance-1) would produce the following output:

```
OUT: This is normal output. Most of your game's output will be this type.
OUT: InstanceOutput.write is just a shorthand for writeNormal!
OUT: This is major output. Save this for really important stuff.
OUT: This is minor output. Use this for repetitive/flavor text that isn't necessary for the player to see.
OUT: This is a title.
```

Notice that the line of debug output didn't show up. That's because output lines of type `DEBUG` are only emitted when the [`debug`](#gameoptions) option is set to true, and it is set to false by default. Similarly, output lines of type `MINOR` are only emitted when the [`showMinor`](#gameoptions) option is set to true, which is its default value.

Executing the event again with `debug: true` and `showMinor: false` in the [game configuration](#game-configuration) produces the following output:

```
OUT: This is normal output. Most of your game's output will be this type.
OUT: InstanceOutput.write is just a shorthand for writeNormal!
OUT: This is major output. Save this for really important stuff.
OUT: This is debug output. It's only visible when the debug option is enabled.
OUT: This is a title.
```

Despite each of these lines having different types, they all look the same when printed via the default Regal client. This is because `OutputLine.type` is left to the client for interpretation; it's up to the Regal client to decide how each type of output is handled. For more information, see [Handling Responses](#handling-responses).

### `GameApi` and API Hooks

Regal games are played through a [`GameApi`](#gameapi), which is the public interface for interacting with a Regal game. A client application will consume this API, using its methods to generate game instances, post commands, and receive output.

[`GameApi`](#gameapi) has the following signature:

```ts
interface GameApi {
    getMetadataCommand(): GameResponse
    postPlayerCommand(instance: GameInstance, command: string): GameResponse
    postStartCommand(options?: Partial<GameOptions>): GameResponse
    postUndoCommand(instance: GameInstance): GameResponse
    postOptionCommand(instance: GameInstance, options: Partial<GameOptions>): GameResponse
}
```

Each method is a different type of command that can be sent to the Regal game and returns some [`GameResponse`](#gameresponse).

Three of these commands, [`postPlayer`](#postplayercommand), [`postUndo`](#postundocommand), and [`postOption`](#postoptioncommand), all require the current [`GameInstance`](#gameinstance-1). The other two, [`getMetadata`](#getmetadatacommand) and [`postStart`](#poststartcommand), do not.

Some of these commands will be described in more detail below. Consult the [API Reference](#api-reference) for a complete description.

#### Handling Commands with API Hooks

Out of the five game commands listed above, two of them must be handled explicitly by the game developer. These commands, [`postStart`](#poststartcommand) and [`postPlayer`](#postplayercommand), are handled by the hook functions [`onStartCommand`](#onstartcommand) and [`onPlayerCommand`](#onplayercommand) respectively.

A hook function is used to control what happens when a command is received by the [`GameApi`](#gameapi).

[`onStartCommand`](#onstartcommand) takes an [`EventFunction`](#eventfunction) as its only argument. This event function is executed when a [`postStart`](#poststartcommand) command is sent to the [`GameApi`](#gameapi).

```ts
import { onStartCommand } from "regal";

onStartCommand(game => {
    game.output.write("Hello, world!");
});
```

With this hook in place, starting a new game will return the following output to the player:

```
START: Hello, world!
```

[`onPlayerCommand`](#onplayercommand) is slightly more complicated. It takes a function which receives a string as input and outputs an [`EventFunction`](#eventfunction). This string will be any text command sent by the player and the event will be executed when a  [`postPlayer`](#postplayercommand) command is sent to the [`GameApi`](#gameapi).

```ts
import { onPlayerCommand } from "regal";

onPlayerCommand(command => game => {
    game.output.write(`You wrote '${command}'!`);
});
```

With this hook in place, a player's input (like `dance`) will return the following output:

```
INPUT: You wrote 'dance'!
```

Both [`onStartCommand`](#onstartcommand) and [`onPlayerCommand`](#onplayercommand) must be called exactly once from somewhere in your game's source.

#### Using `Game`

The Regal Game Library's global implementation of the extended game API is called [`Game`](#game). The [`Game`](#game) object is used for external interaction with the game and shouldn't be accessed within the game itself.

Usually, you won't use [`Game`](#game) directly. Regal games should be bundled before they are used by clients, and these bundles have a different way of exposing a [`GameApi`](#gameapi). See [**bundling**](#bundling) for more information.

However, there are certain cases where you might prefer to access [`Game`](#game) directly, such as for unit tests. In these situations, both [`Game`](#game) and your game's source need to be imported.

```ts
import { Game } from "regal";
import "./my-game-src"; // Imports the game's root file, which has no exports
```

Before any command may be executed, [`Game.init()`](#init) must be called first. This method takes a [`GameMetadata`](#gamemetadata) object, which must contain at least a `name` and an `author`.

```ts
Game.init({
    name: "My Cool Game",
    author: "Me"
});
```

Using the hooks defined earlier, a new game instance can be generated with [`Game.postStartCommand()`](#poststartcommand):

```ts
const startResponse = Game.postStartCommand();
```

The resulting [`GameResponse`](#gameresponse) has two properties: `instance` and `output`. `instance` refers to the current [`GameInstance`](#gameinstance-1). `output` contains all output generated by the last game cycle, which here would be:

```json
{
    "log": [
        {
            "data": "Hello, world!",
            "id": 1,
            "type": "NORMAL"
        }
    ],
    "wasSuccessful": true
}
```

Similarly, a player command can be executed with [`Game.postPlayerCommand()`](#postplayercommand). This method takes two arguments: `instance` and `command`. `instance` refers to the current [`GameInstance`](#gameinstance-1), and `command` is a string containing the player's command.

```ts
const playerResponse = Game.postPlayerCommand(startResponse.instance, "bark");
```

This response contains a new [`GameInstance`](#gameinstance-1), *leaving the original instance unchanged*, and the following output:

```json
{
    "log": [
        {
            "data": "You wrote 'bark'!",
            "id": 2,
            "type": "NORMAL"
        }
    ],
    "wasSuccessful": true
}
```

When a client plays a Regal game, all it has to do behind the scenes is send a series of these commands.

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/external-snippets/using-game.ts).*

#### Undoing Player Commands

Because Regal games are deterministic, the effects of any command on the [`GameInstance`](#gameinstance-1) can be undone. Essentially, this "rolls back" the instance state to the state it was at before the reverted command was executed.

For example, here is a game that stores each command in an array in the state:

```ts
// undo-game-src.ts
import { onPlayerCommand, onStartCommand, on } from "regal";

// Print out the list of items in the state
const printItems = on("ITEMS", game => {
    const itemsString = game.state.items.join(", ");
    game.output.write(`Items (${game.state.items.length}) -> [${itemsString}]`);
});

onStartCommand(game => {
    game.state.items = []; // Initialize state.items with an empty array
    return printItems;
});

onPlayerCommand(command => game => {
    game.output.write(`Adding ${command}.`);
    game.state.items.push(command); // Add the new item to the state
    return printItems;
});
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/external-snippets/undo.ts).*

Executing a start command would produce the following output:

```
ITEMS: Items (0) -> []
```

Executing three player commands, `cat`, `dog`, and `mouse`, would result in this output:

```
INPUT: Adding cat.
ITEMS: Items (1) -> [cat]

INPUT: Adding dog.
ITEMS: Items (2) -> [cat, dog]

INPUT: Adding mouse.
ITEMS: Items (3) -> [cat, dog, mouse]
```

A client can undo the last player or undo command executed on the [`GameInstance`](#gameinstance-1) with [`Game.postUndoCommand()`](#postundocommand). This method takes only one argument, which is the current [`GameInstance`](#gameinstance-1).

If the following line was executed:

```ts
const newInstance = Game.postUndoCommand(oldInstance);
```

Then `newInstance` would contain the state of the instance from before the player's `mouse` command was executed. `oldInstance` would remain unchanged.

If another player command, `goose`, was executed, then this would be the output:

```
Adding goose.
Items (3) -> [cat, dog, goose]
```

While being able to undo commands can be quite useful, it doesn't make sense for all games. Therefore, the game developer can control whether the [`GameApi`](#gameapi) should allow clients to execute undo commands. This is accomplished with an API hook function, [`onBeforeUndoCommand`](#onbeforeundocommand). 

Like the other [hook functions](#handling-commands-with-api-hooks), [`onBeforeUndoCommand`](#onbeforeundocommand) controls the behavior of the Game API. Its only argument is a function that receives a [`GameInstance`](#gameinstance-1) and returns a boolean.

Whenever a [`postUndo`](#postundocommand) command is sent to the [`GameApi`](#gameapi), the `beforeUndo` hook is executed on the current [`GameInstance`](#gameinstance-1). If the function returns true, the undo will proceed. If it returns false, an error will throw instead.

To prevent all undo commands, simply make the `beforeUndo` hook always return false:

```ts
import { onBeforeUndoCommand } from "regal";

onBeforeUndoCommand(game => false);
```

With this configuration, executing a `postUndo` command would return an unsuccessful response with the following error:

```
RegalError: Undo is not allowed here.
```

[`onBeforeUndoCommand`](#onbeforeundocommand) can be used to allow or deny undo commands based on some condition of the game state. For instance, the following hook prevents our example from being undone when a previous player command was `goose`:

```ts
onBeforeUndoCommand(game =>
    !game.state.items.includes("goose") // Block undo if there's a goose in the array
);
```

A call to [`onBeforeUndoCommand`](#onbeforeundocommand) is not required, and will default to always allowing undo commands if not otherwise set.

### Configuration

A Regal game's configuration consists of two types: [`GameMetadata`](#gamemetadata) and [`GameOptions`](#gameoptions).

[`GameMetadata`](#gamemetadata) contains metadata about the game, such as its title and author. [`GameOptions`](#gameoptions) contains configurable options to control the game's behavior.

#### Using Configuration Files

Configuration for a Regal game is usually kept in the project's root directory, in a file called `regal.json`. This file contains both [metadata](#gamemetadata) and [options](#gameoptions).

A game's `regal.json` file might look something like this:

```json
{
    "game": {
        "name": "My Awesome Game",
        "author": "Joe Cowman",
        "headline": "This is the best game ever.",
        "description": "Let me tell you why this is the best game ever...",
        "options": {
            "debug": true,
            "seed": "1234"
        }
    }
}
```

Note that a `regal.json` file is optional. The essential properties of [`GameMetadata`](#gamemetadata), which are `name` and `author`, as well as others properties will be taken from those of the same keys in `package.json` if they aren't specified in a `regal.json` file.

A configuration loading tool like [**regal-bundler**](https://github.com/regal/regal-bundler) is needed if using `regal.json` or the `regal` property in `package.json`. See [**bundling**](#bundling) for more information.

Alternatively, metadata values can be passed explicitly via [`GameApiExtended.init()`](#init). Either way, a metadata object with at least the `name` and `author` properties specified is required before a game can receive commands.

```ts
import { Game } from "regal";

Game.init({
    name: "My Game",
    author: "Me"
});
```

#### Configuring Game Options

The Regal Game Library provides several options for configuring the behavior of game instances. These options are stored as an interface called [`GameOptions`](#gameoptions).

When a game is initialized, either through [`GameApiExtended.init()`](#init) or loading a `regal.json` file, any values provided in [`GameMetadata.options`](#gamemetadata) will become the default values for every instance of that game.

Here is an example:

```ts
// options-demo.ts
import { Game } from "regal";
import "./options-game-src";

Game.init({
    name: "My Game",
    author: "Me",
    options: {
        debug: true,   // Set debug to true
        seed: "Hello!" // Set seed to "Hello!"
    }
});
```

With this configuration, every instance of `My Game` would start with its `debug` option set to true instead of false, and its `seed` set to "Hello!".

A convenient way to check the values of an instance's [`GameOptions`](#gameoptions) is by using [`GameInstance.options`](#gameinstance-1), which is a read-only container for all current options in the instance. The property is of type [`InstanceOptions`](#instanceoptions).

This can be combined with [`InstanceOutput.writeDebug()`](#writedebug) to produce some helpful information for development:

```ts
// options-game-src.ts
onStartCommand(game => {
    game.output.write("Startup successful.");
    game.output.writeDebug(`Current seed -> ${game.options.seed}`);
});
```

Starting a new game instance using the configuration from earlier would yield the following output:

```
START: Startup successful.
START: Current seed -> Hello!
```

If you wanted to generate a [`GameInstance`](#gameinstance-1) with `debug` disabled, you could pass in any option overrides to the optional argument of [`Game.postStartCommand()`](#poststartcommand).

```ts
// options-demo.ts
let res = Game.postStartCommand({ debug: false });
```

With `debug` set to false, `res` would contain only the one line of output:

```
START: Startup successful.
```

To modify the options of a pre-existing [`GameInstance`](#gameinstance-1), use [`Game.postOptionCommand()`](#postoptioncommand).

```ts
res = Game.postOptionCommand(res.instance, { showMinor: false });
```

This would disable `showMinor` for all future game cycles of the [`GameInstance`](#gameinstance-1) (unless it got changed again).

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/external-snippets/options-demo.ts).*

The priority of [`GameOptions`](#gameoptions) from highest to lowest is:

1. Instance-specific overrides (i.e. values passed in [`Game.postStartCommand()`](#poststartcommand) or [`Game.postOptionCommand()`](#postoptioncommand)).
2. Static overrides (i.e. values loaded from `regal.json` or set with [`Game.init()`](#init)).
3. The options' default values.

### Bundling

In order for a Regal game to be played by clients, it must be bundled first. *Bundling* is the process of converting a Regal game's **development source** (i.e. the TypeScript source files that the game developer writes) into a **game bundle**, which is a self-contained file that contains all the code necessary to play the game via a single API.

> Game bundles are the form through which Regal games are shared, downloaded, and played.

#### Using the CLI

The easiest way to bundle a game is with the [**Regal CLI**](https://github.com/regal/regal-cli).

Once you have the CLI installed, use the `bundle` command to generate a game bundle.

```
$ regal bundle
Created a game bundle for 'my-first-game' at /Users/user/myDir/my-first-game.regal.js
```

This creates a JavaScript file, which contains all the game's dependencies (including the Game Library) and exports an implementation of [`GameApi`](#gameapi) for [playing](#playing-a-bundled-game) the game. By default, the generated bundle file will be named `my-game.regal.js`, where `my-game` is a sanitized version of the game's name, as specified in [`GameMetadata`](#gamemetadata).

For a list of configuration options you can use, consult the CLI's [documentation](https://github.com/regal/regal-cli/#bundle).

#### Using `regal-bundler`

You can access the bundling API directly with [**regal-bundler**](https://github.com/regal/regal-bundler).

First, install `regal-bundler`:

```
npm install --save-dev regal-bundler
```

Generate a game bundle with the asynchronous `bundle()` function. 

```ts
import { bundle } from "regal-bundler";

bundle(); // Creates a bundle file
```

[`bundle()`](https://github.com/regal/regal-bundler/blob/master/README.md#configuration) accepts an optional configuration object that can be used to control certain behaviors of the bundler, such as the location of [`input`](https://github.com/regal/regal-bundler#bundlerinputfile-string) or [`output`](https://github.com/regal/regal-bundler#bundleroutputfile-string) files, the module [`format`](https://github.com/regal/regal-bundler#bundleroutputformat-string) of the bundle, or whether [minification](https://github.com/regal/regal-bundler#bundleroutputminify-boolean) should be done on the bundle after it's generated.

This configuration object can either be passed into the [`bundle()`](https://github.com/regal/regal-bundler/blob/master/README.md#configuration) function itself or included under the `"bundler"` property in [`regal.json`](#using-configuration-files).

#### Playing a Bundled Game

A standard game bundle exports an implementation of [`GameApi`](#gameapi), which is used to play the game.

The [**Regal CLI**](https://github.com/regal/regal-cli) can be used to play a game bundle from the terminal via the [`play`](https://github.com/regal/regal-cli#play) command:

```
$ regal play my-first-game.regal.js
Now Playing: my-first-game by Your Name Here
Type :quit to exit the game.

Hello, World!
```

Alternatively, the bundle's [`GameApi`](#gameapi) can be imported as a JavaScript module and accessed programmatically:

```ts
const myGame: GameApi = await import("./my-game.regal.js");

let resp = myGame.postStartCommand();
resp = myGame.postPlayerCommand(resp.instance, "Hello, World!");
```

*Note: This example is available [here](https://github.com/regal/demos/blob/master/snippets/external-snippets/bundler-demo.ts).*

Once your game is bundled, only the bundle file is needed to play it.

## API Reference

* [`Agent`](#agent)
* [`AgentMeta`](#agentmeta)
* [`Charsets`](#charsets)
* [`EventFunction`](#eventfunction)
* [`EventQueue`](#eventqueue)
* [`Game`](#game)
* [`GameApi`](#gameapi)
* [`GameApiExtended`](#gameapiextended)
* [`GameEventBuilder`](#gameeventbuilder)
* [`GameInstance`](#gameinstance-1)
* [`GameMetadata`](#gamemetadata)
* [`GameOptions`](#gameoptions)
* [`GameResponse`](#gameresponse)
* [`GameResponseOutput`](#gameresponseoutput)
* [`InstanceEvents`](#instanceevents)
* [`InstanceOptions`](#instanceoptions)
* [`InstanceOutput`](#instanceoutput)
* [`InstanceRandom`](#instancerandom)
* [`OutputLine`](#outputline)
* [`OutputLineType`](#outputlinetype)
* [`PK`](#pk)
* [`RegalError`](#regalerror)
* [`TrackedEvent`](#trackedevent)
* [`enqueue`](#enqueue-1)
* [`noop`](#noop)
* [`nq`](#nq-1)
* [`on`](#on)
* [`onBeforeUndoCommand`](#onbeforeundocommand)
* [`onPlayerCommand`](#onplayercommand)
* [`onStartCommand`](#onstartcommand)

### `Agent`

**_Class_**

A game object.

```ts
class Agent {
    meta: AgentMeta
    constructor()
}
```

#### Description

A game object, or *agent*, is a JavaScript object that contains Regal game state. Every agent should inherit from the `Agent` class.

Before an agent's properties can be accessed in a game cycle, the agent must be activated. Activating an agent registers the agent with the game instance,  and can happen either *explicitly* or *implicitly*.

An inactive agent is activated *explicitly* with [`GameInstance.using()`](#gameinstance-1).

```ts
const activeAgent = game.using(new CustomAgent());
```

Alternatively, an inactive agent that's contained in another agent's property can be activated *implicitly* when that owner agent is activated. Here is one way this can happen:

```ts
const owner = new CustomAgent("owner");
owner.child = new CustomAgent("child");

const activeOwner = game.using(owner); // owner.child is activated as well
```

In total, there are five ways for an inactive agent (`child`) to be activated implicitly by some agent (`owner`):
* `child` is a property of `owner` when `owner` is activated.
* `child` is set as a property of `owner`, which is already activated.
* `child` is stored in an array that is a property of `owner` when `owner` is activated.
* `child` is stored in an array that is set as a property of `owner`, which is already activated.
* `child` is added to an array that is a property of `owner`, which is already activated.

Trying to read or modify a property of an agent that hasn't been activated will throw a [`RegalError`](#regalerror).

#### Constructor

Constructs a new `Agent`. This constructor should almost never be called directly, but rather should be called with `super()` from a subclass.

If called in the game's static context (i.e. outside of a game cycle), a static agent will be created, and an id will be reserved for this agent for all game instances.

#### Properties

Property | Description
--- | ---
`meta: AgentMeta` | The agent's metadata, such as its agent id and prototype id.

### `AgentMeta`

**_Interface_**

A special object associated with every [`Agent`](#agent) which contains important metadata related to that [`Agent`](#agent).

```ts
interface AgentMeta {
    id: PK<Agent>
    protoId: PK<"AgentProto">
}
```

#### Description

Properties in `AgentMeta` do not have their changes tracked through [`InstanceEvents`](#instanceevents) like all other agent properties.

#### Properties

Property | Description
--- | ---
`id: PK<Agent>` | The agent's unique identifier in the context of the current game.
`protoId: PK<"AgentProto">` | The unique identifier for the agent's prototype.

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

For use with [`InstanceRandom.string()`](#string).

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

Calls the [`onBeforeUndoCommand`](#onbeforeundocommand) hook to determine if the undo is allowed. If the hook has not been implemented, undo is allowed by default.

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
    name: string
    author: string
    headline?: string
    description?: string
    homepage?: string
    repository?: string
    options?: Partial<GameOptions>
    regalVersion?: string
    gameVersion?: string
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

Property Rules:
* If any of the metadata properties `name`, `author`, `description`,  `homepage`, or `repository` aren't specified, the values of each property with the same name in `package.json` will be used.
* `gameVersion` will be loaded from `package.json` only.
* `regalVersion` should not be specified, as it is set by the library automatically. If a value is passed for `regalVersion`, an error will be thrown.

A configuration loading tool like [**regal-bundler**](https://github.com/regal/regal-bundler) is needed if using `regal.json` or the `regal` property in `package.json`. Alternatively, metadata values can be passed explicitly via [`GameApiExtended.init()`](#init). Either way, a metadata object with at least the `name` and `author` properties specified is required before a game can receive commands.

This metadata is defined in the game's static context, meaning that it is the same for all instances of the game.

#### Properties

Property | Description
--- | ---
`name: string` | The game's title.
`author: string` | The game's author.
`headline?: string` | The full description of the game.
`homepage?: string` | The URL of the project's homepage.
`repository?: string` | The URL of the project's repository.
`options?: Partial<GameOptions>` | Any options overrides for the game.
`regalVersion?: string` | The version of the Regal Game Library used by the game.
`gameVersion?: string` | The game's version.

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

#### Child Interfaces

* [`InstanceOptions`](#instanceoptions)

#### Properties

Property | Description
--- | ---
`readonly allowOverrides: string[] \| boolean` | Game options that can be overridden by a Regal client. Can be an array of strings or a boolean. Defaults to true. <br> If an array of strings, these options will be configurable by a Regal client. Note that `allowOverrides` is never configurable, and including it will throw an error. <br> If `true`, all options except `allowOverrides` will be configurable. If `false`, no options will be configurable.
`readonly debug: boolean` | Whether output of type `DEBUG` should be returned to the client. Defaults to false.
`readonly showMinor: boolean` | Whether output of type `MINOR` should be returned to the client. Defaults to true.
`readonly trackAgentChanges: boolean` | Whether all changes to agent properties are tracked and returned to the client. Defaults to false. <br> If `false`, only the values of each property at the beginning and end of each game cycle will be recorded. If `true`, all property changes will be recorded.
`readonly seed: string \| undefined` | Optional string used to initialize pseudorandom number generation in each game instance. <br> When multiple instances have the same seed, they will generate the same sequence of random numbers through the `InstanceRandom` API. If left undefined, a random seed will be generated.

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

**_Interface_**

Manager for all events in a [`GameInstance`](#gameinstance-1).

```ts
interface InstanceEvents {
    invoke(event: TrackedEvent): void
}
```

#### Description

Every event that occurs on a [`GameInstance`](#gameinstance-1) passes through this interface, although most of the time this happens internally.

#### Methods

##### `invoke()`

Executes the given event and all events caused by it.

```ts
invoke(event: TrackedEvent): void
```

**Parameters**

Parameter | Description
--- | ---
`event: TrackedEvent` | The `TrackedEvent` to be invoked.

### `InstanceOptions`

**_Interface_**

Read-only container that provides an interface to view the game instance's current game options.

```ts
interface InstanceOptions extends GameOptions {}
```

#### Description

Has an identical signature to [`GameOptions`](#gameoptions).

Setting any properties of [`GameInstance.options`](#properties-3) will throw a [`RegalError`](#regalerror).

#### Extends

[`GameOptions`](#gameoptions)

### `InstanceOutput`

**_Interface_**

Interface for managing and emitting output through a [`GameInstance`](#gameinstance-1).

```ts
interface InstanceOutput {
    readonly lineCount: number
    lines: OutputLine[]
    writeLine(line: string, lineType?: OutputLineType): void
    write(...lines: string[]): void
    writeNormal(...lines: string[]): void
    writeMajor(...lines: string[]): void
    writeMinor(...lines: string[]): void
    writeDebug(...lines: string[]): void
    writeTitle(line: string): void
}
```

#### Description

Output is modeled as lines with properties specifying their semantic meaning. For more information, see [`OutputLine`](#outputline).

#### Properties

Property | Description
--- | ---
`readonly lineCount: number` | The number of `OutputLine`s that have been generated over the life of the `GameInstance`.
`lines: OutputLine[]` | The `OutputLine`s generated during the current game cycle.

#### Methods

##### `writeLine()`

Writes a single line of output to the client.

```ts
writeLine(line: string, lineType?: OutputLineType): void
```

**Parameters**

Parameter | Description
--- | ---
`line: string` | The text string to be emitted.
`lineType?: OutputLineType` | The line's semantic meaning. (Defaults to `OutputLineType.NORMAL`)

##### `write()`

Writes one or more lines of type [`OutputLineType.NORMAL`](#outputlinetype) to the output.

```ts
write(...lines: string[]): void
```

**Parameters**

Parameter | Description
--- | ---
`...lines: string[]` | The text to be emitted.

##### `writeNormal()`

Writes one or more lines of type [`OutputLineType.NORMAL`](#outputlinetype) to the output.

```ts
writeNormal(...lines: string[]): void
```

**Parameters**

Parameter | Description
--- | ---
`...lines: string[]` | The text to be emitted.

##### `writeMajor()`

Writes one or more lines of type [`OutputLineType.MAJOR`](#outputlinetype) to the output.

```ts
writeMajor(...lines: string[]): void
```

**Parameters**

Parameter | Description
--- | ---
`...lines: string[]` | The text to be emitted.

##### `writeMinor()`

Writes one or more lines of type [`OutputLineType.MINOR`](#outputlinetype) to the output.

```ts
writeMinor(...lines: string[]): void
```

**Parameters**

Parameter | Description
--- | ---
`...lines: string[]` | The text to be emitted.

##### `writeDebug()`

Writes one or more lines of type [`OutputLineType.DEBUG`](#outputlinetype) to the output.

```ts
writeDebug(...lines: string[]): void
```

**Parameters**

Parameter | Description
--- | ---
`...lines: string[]` | The text to be emitted.

##### `writeTitle()`

Writes a line of type [`OutputLineType.SECTION_TITLE`](#outputlinetype) to the output.

```ts
writeTitle(line: string): void
```

**Parameters**

Parameter | Description
--- | ---
`line: string` | The text to be emitted.

### `InstanceRandom`

**_Interface_**

Interface for generating deterministic, pseudo-random data for the game instance.

```ts
interface InstanceRandom {
    readonly seed: string
    int(min: number, max: number): number
    decimal(): number
    string(length: number, charset?: string): string
    choice<T>(array: T[]): T
    boolean(): boolean
}
```

#### Description

The data are considered deterministic because any `InstanceRandom` with some
identical `seed` will generate the same sequence of pseudo-random values.

#### Properties

Property | Description
--- | ---
`readonly seed: string` | The string used to initialize the pseudo-random data generator.

#### Methods

##### `int()`

Generates a pseudo-random integer within the given inclusive range.

```ts
int(min: number, max: number): number
```

**Parameters**

Parameter | Description
--- | ---
`min: number` | The minimum possible number (inclusive).
`max: number` | The maximum possible number (exclusive).

**Returns**

`number`: A pseudo-random integer within the given inclusive range.

##### `decimal()`

Generates a pseudo-random number between zero (inclusive) and one (exclusive).

```ts
decimal(): number
```

**Returns**

`number`: A pseudo-random number between zero (inclusive) and one (exclusive).

##### `string()`

Generates a string of pseudo-random characters (duplicate characters allowed).

```ts
string(length: number, charset?: string): string
```

**Parameters**

Parameter | Description
--- | ---
`length: number` | The length of the string to generate.
`charset?: string` | A string containing the characters to choose from when generating the string. Duplicates are okay, but the charset must have at least two unique characters. (Defaults to [`Charsets.EXPANDED_CHARSET`](#charsets))

**Returns**

`string`: A string of pseudo-random characters.

##### `choice()`

Returns a pseudo-random element from the given array without modifying anything.

```ts
choice<T>(array: T[]): T
```

**Generic Type Parameters**

Parameter | Description
--- | ---
`T` | The type of element in the array.

**Parameters**

Parameter | Description
--- | ---
`array: T[]` | The array to select from.

**Returns**

`T`: A pseudo-random element from the given array.

##### `boolean()`

Generates either `true` or `false` pseudo-randomly.

```ts
boolean(): boolean
```

**Returns**

`boolean`: Either `true` or `false`.

### `OutputLine`

**_Interface_**

A line of text that is sent to the client and is meant to notify the player of something that happened in the game.

```ts
interface OutputLine {
    id: PK<OutputLine>
    data: string
    type: OutputLineType
}
```

#### Properties

Property | Description
--- | ---
`id: PK<OutputLine>` | The `OutputLine`'s unique identifier.
`data: string` | The text string.
`type: OutputLineType` | The line's semantic type. (see [`OutputLineType`](#outputlinetype))

### `OutputLineType`

**_Enum_**

Conveys semantic meaning of an [`OutputLine`](#outputline) to the client.

```ts
enum OutputLineType {
    NORMAL = "NORMAL"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    DEBUG = "DEBUG"
    SECTION_TITLE = "SECTION_TITLE"
}
```

#### Members

Member | Description
--- | ---
`NORMAL = "NORMAL"` | Standard output line; presented to the player normally. (Default) <br> Use for most game content.
`MAJOR = "MAJOR"` | Important line; emphasized to the player. <br> Use when something important happens.
`MINOR = "MINOR"` | Non-important line; emphasized less than `OutputLineType.NORMAL` lines, and won't always be shown to the player. <br> Use for repetitive/flavor text that might add a bit to the game experience, but won't be missed if it isn't seen.
`DEBUG = "DEBUG"` | Meant for debugging purposes; only visible when the `debug` option is enabled.
`SECTION_TITLE = "SECTION_TITLE"` | Signifies the start of a new section or scene in the game. (i.e. **West of House**)

### `PK`

**_Interface_**

Primary key for an indexed class, a class of which there are many instances that each need a unique identifier.

```ts
interface PK<T> {
    plus(n: number): PK<T>
    minus(n: number): PK<T>
    equals(key: PK<T>): boolean
    value(): string
    index(): number
}
```

#### Description

The `PK` interface is mainly for internal use, but as there are other interfaces within the public API which depend on `PK` (such as `Agent` and `OutputLine`), it is part of the public API as well.

#### Generic Type Parameters

Parameter | Description
--- | ---
`T` | An identifier for the class referenced by this `PK` type.

#### Methods

##### `plus()`

Generates the primary key that would be generated `n` keys after this one. The result of this function should never be used to assign a key to an object. It's only for comparison.

```ts
plus(n: number): PK<T>
```

**Parameters**

Parameter | Description
--- | ---
`n: number` | The number of times the returned key should be incremented

**Returns**

`PK<T>`: The generated primary key

##### `minus()`

Generates the primary key that would be generated `n` keys before this one. The result of this function should never be used to assign a key to an object. It's only for comparison.

```ts
minus(n: number): PK<T>
```

**Parameters**

Parameter | Description
--- | ---
`n: number` | The number of times the returned key should be decremented

**Returns**

`PK<T>`: The generated primary key

##### `equals()`

Calculates whether this key is equivalent to the given one.

```ts
equals(key: PK<T>): boolean
```

**Parameters**

Parameter | Description
--- | ---
`key: PK<T>` | The key to test

**Returns**

`boolean`: Whether they are equivalent

##### `value()`

Generates a string value representative of this key.

```ts
value(): string
```

**Description**

This is used for the `equals` method, which is strongly preferred for testing the equality of two keys.

**Returns**

`string`: A hash value representative of the key.

##### `index()`

Returns the placement of this key in the list of all keys.

```ts
index(): number
```

**Description**

For example, an index of 2 means this was the second key generated.

This includes reserved keys; if a set of reserved keys was used to generate this key's `PKProvider`, the entry with the lowest value will have an index of 0.

**Returns**

`number`: The index of this key.

### `RegalError`

**_Class_**

Error that is thrown if a Regal function fails.

```ts
class RegalError extends Error {
    constructor(message: string)
}
```

#### Extends

`Error`

#### Constructor

Constructs a `RegalError` with the given message.

```ts
constructor(message: string)
```

**Parameters**

Parameter | Description
--- | ---
`message: string` | The error message, which will be prepended with "RegalError: ".

### `TrackedEvent`

**_Interface_**

An [`EventFunction`](#eventfunction) that is tracked by the game instance.

```ts
interface TrackedEvent<StateType = any> extends EventFunction<StateType> {
    (game: GameInstance<StateType>): TrackedEvent<StateType> | EventFunction<StateType>
    eventName: string
    target: EventFunction<StateType>
    then(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
    thenq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
}
```

#### Description

In order for Regal to behave properly, all modifications of game state should take place inside tracked events.

Just like an [`EventFunction`](#eventfunction), a [`TrackedEvent`](#trackedevent) can be invoked as a function by passing in a [`GameInstance`](#gameinstance-1) for its only argument.

#### Extends

[`EventFunction`](#eventfunction)

#### Subtypes

* [`EventQueue`](#eventqueue)

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Function Invocation

```ts
(game: GameInstance<StateType>): TrackedEvent<StateType> | EventFunction<StateType>
```

**Parameters**

Parameter | Description
--- | ---
`game: GameInstance<StateType>` | The `GameInstance` to be modified.

**Returns**

`TrackedEvent<StateType> | EventFunction<StateType>`: The next [`TrackedEvent`](#trackedevent) or [`EventFunction`](#eventfunction) to be invoked on the [`GameInstance`](#gameinstance-1).

#### Properties

Property | Description
--- | ---
`eventName: string` | The name of the event.
`target: EventFunction<StateType>` | The `EventFunction` that is wrapped by the `TrackedEvent`.

#### Methods

##### `then()`

Adds events to the front of the event queue.

```ts
then(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
```

**Parameters**

Parameter | Description
--- | ---
`...events: Array<TrackedEvent<StateType>>` | The events to be added.

**Returns**

An [`EventQueue`](#eventqueue) with the new events.

##### `thenq()`

Adds events to the end of the event queue.

```ts
thenq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>
```

**Description**

Equivalent to calling `trackedEvent.then(nq(...events))`.

**Parameters**

Parameter | Description
--- | ---
`...events: Array<TrackedEvent<StateType>>` | The events to be added.

**Returns**

An [`EventQueue`](#eventqueue) with the new events.

### `enqueue`

**_Function_**

Creates an [`EventQueue`](#eventqueue) that adds the events to the end of the game's internal queue, meaning they will be executed after all of the currently queued events are finished.

```ts
const enqueue: <StateType = any>(
    ...events: Array<TrackedEvent<StateType>>
) => EventQueue<StateType>
```

#### Description

If the events are [`EventQueue`](#eventqueue)s, any events in the queues' `immediateEvents` collections will be concatenated, followed by any events in the queues' `delayedEvents`.

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Parameters

Parameter | Description
--- | ---
`...events: Array<TrackedEvent<StateType>>` | The events to be added.

#### Returns

`EventQueue<StateType`: An [`EventQueue`](#eventqueue) that place all events in the `delayedEvent` array when invoked.

### `noop`

**_Const Object_**

Reserved [`TrackedEvent`](#trackedevent) that signals no more events.

```ts
const noop: TrackedEvent
```

#### Description

`noop` is short for *no operation*.

Meant to be used in rare cases where an event cannot return `void` (i.e. forced by the TypeScript compiler).

```ts
on("EVENT", game => 
    // Return another event to be executed if some condition holds, otherwise stop.
    game.state.someCondition ? otherEvent | noop; 
);
```

#### Implements

[`TrackedEvent`](#trackedevent)

### `nq`

**_Function_**

Alias of [`enqueue`](#enqueue-1).

```ts
const nq: <StateType = any>(
    ...events: Array<TrackedEvent<StateType>>
) => EventQueue<StateType>
```

### `on`

**_Function_**

Constructs a [`TrackedEvent`](#trackedevent), which is a function that modifies a [`GameInstance`](#gameinstance-1) and tracks all state changes as they occur.

```ts
const on: <StateType = any>(
    eventName: string,
    eventFunc: EventFunction<StateType>
) => TrackedEvent<StateType>
```

#### Description

All modifications to game state within a Regal game should take place through a [`TrackedEvent`](#trackedevent).

This function is the standard way to declare a [`TrackedEvent`](#trackedevent).

```ts
const EVENT = on("EVENT", game => {
    game.state.foo = "bar"
});
```

#### Generic Type Parameters

Parameter | Description
--- | ---
`StateType = any` | The `GameInstance` state type. Optional, defaults to `any`.

#### Parameters

Parameter | Description
--- | ---
`eventName: string` | The name of the `TrackedEvent`.
`eventFunc: EventFunction<StateType>` | The function that will be executed on a `GameInstance`.

#### Returns

`TrackedEvent<StateType>`: The generated [`TrackedEvent`](#trackedevent).

### `onBeforeUndoCommand`

**_Function_**

[`GameApi`](#gameapi) hook that sets the function to be executed whenever [`GameApi.postUndoCommand`](#postUndoCommand) is called, before the undo operation is executed.

```ts
const onBeforeUndoCommand: (
    handler: (game: GameInstance) => boolean
) => void
```

#### Description

If the handler function returns `true`, the undo will be allowed. If it returns `false`, the undo will not be allowed. If the hook is never set, all valid undo operations will be allowed.

May only be set once.

```ts
onBeforeUndoCommand(game => game.state.someCondition); // Allows undo if someCondition is true.
```

#### Parameters

Parameter | Description
--- | ---
`handler: (game: GameInstance) => boolean` | Returns whether the undo operation is allowed, given the current `GameInstance`.

### `onPlayerCommand`

**_Function_**

[`GameApi`](#gameapi) hook that sets the function to be executed whenever a player command is sent to the Game API via [`GameApi.postPlayerCommand`](#postPlayerCommand).

```ts
const onPlayerCommand: (
    handler: (command: string) => EventFunction
) => void
```

#### Description

May only be set once.

*Example Usage:*

```ts
onPlayerCommand(command => on("GREET", game => {
    game.output.write(`Hello, ${command}!`);
}));
```

#### Parameters

Parameter | Description
--- | ---
`handler: (command: string) => EventFunction` | A function that takes a string containing the player's command and returns an `EventFunction`. May be an `EventFunction`, `TrackedEvent`, or `EventQueue`.

### `onStartCommand`

**_Function_**

[`GameApi`](#gameapi) hook that sets the function to be executed whenever a start command is sent to the Game API via [`GameApi.postStartCommand`](#postStartCommand).

```ts
const onStartCommand: (handler: EventFunction) => void
```

#### Description

May only be set once.

*Example Usage:*

```ts
onStartCommand(game => game.output.write("Startup successful!"));
```

#### Parameters

Parameter | Description
--- | ---
`handler: EventFunction` | The `EventFunction` to be executed. May be an `EventFunction`, `TrackedEvent`, or `EventQueue`.

--- 

*Copyright (c) Joe Cowman*
