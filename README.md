# Regal

[![npm version](https://badge.fury.io/js/regal.svg)](https://badge.fury.io/js/regal)
[![CircleCI](https://circleci.com/gh/regal/regal.svg?style=svg)](https://circleci.com/gh/regal/regal)
[![Coverage Status](https://coveralls.io/repos/github/regal/regal/badge.svg?branch=master)](https://coveralls.io/github/regal/regal?branch=master)

## Introduction

The **Regal Game Library** is the official TypeScript library for the [**Regal Framework**](https://github.com/regal/about), a project designed to help developers bring text-driven games and story experiences to players in exciting new ways.

### What is the Regal Framework?

The **Regal Framework** is a set of tools for developers to create text-driven games, sometimes called [Interactive Fiction (IF)](https://en.wikipedia.org/wiki/Interactive_fiction), as highly portable bundles.

For more information, check out the project's [about](https://github.com/regal/about) page.

### How is the Regal Game Library Used?

The **Regal Game Library**, often referred to as the *Game Library* or its package name `regal`, is the JavaScript library that game developers use to create games for the Regal Framework. It was designed with first-class support for [TypeScript](https://www.typescriptlang.org/), but doesn't require it.

When a game is created using the Regal Game Library, it can be played by any Regal client automatically.

### What's the point?

Similar to Java's *"write once, run anywhere"* mantra, the goal of the **Regal Framework** is to produce games that can be played on all kinds of platforms without needing to rewrite any code.

The name _Regal_ is an acronym for **Re**inventing **G**ameplay through **A**udio and **L**anguage. The project was inspired by the idea of playing adventure games on smart voice assistants, but it doesn't have to stop there. Chatrooms, consoles, smart fridges...they're all within reach!

## Table of Contents

* [Introduction](#introduction)
    * [What is the Regal Framework?](#what-is-the-regal-framework?)
    * [How is the Regal Game Library used?](#how-is-the-regal-game-library-used?)
    * [What's the point?](#whats-the-point?)
* [Documentation](#documentation)
    * [Installation](#installation)
    * [Guide: Creating Your First Regal Game](#guide-creating-your-first-regal-game)
    * [API Reference](#api-reference)
        * [Agents](#agents)
        * [Events](#events)
        * [`GameInstance`](#gameinstance)
        * [`GameApi`](#gameapi)
        * [Configuration](#configuration)
    * [Bundling](#bundling)
* [Contributing](#contributing)
* [Project Roadmap](#project-roadmap)

## Documentation

### Installation

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

### Guide: Creating Your First Regal Game

The following is a step-by-step guide for creating a basic game of *Rock, Paper, Scissors* with Regal and TypeScript. 

For more detailed information on any topic, see the [API Reference](#api-reference) below.

#### Step 1. Set up project

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

```npm
install --save-dev typescript
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

#### Step 2. Write game logic

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


#### Step 3. Bundle and play

### API Reference

#### Agents

#### Events

#### `GameInstance`

#### `GameApi`

#### Configuration

### Bundling

## Contributing

Created by Joe Cowman ([jcowman2](https://github.com/jcowman2)).

If you would like to get involved, please see the project's [about](https://github.com/regal/about) page.

## Project Roadmap

*Copyright 2018, Joe Cowman*
