# Events

A game where eveything stays the same isn't much of a game. Therefore, **Regal** provides *events*.

An *event* can be thought of as any change that occurs within your game. Any time the state of your game changes, it is contained in an event. This guide will help you use events in your game.

## Event Functions

The *Event Function* is one of **Regal**'s central ideas.

An *Event Function* takes a `GameInstance` as an argument and modifies it. Its contract looks like this:

```ts
type EventFunction = (game: GameInstance) => void;
```

Every *event* is actually an `EventFunction`.

## Your First Event

A very basic event might look like this:

```ts
const greet: EventFunction = (game: GameInstance) => {
    game.output.write("Hello, world!");
}
```

This event takes in a `GameInstance` and writes "Hello, world!" to its output. We could call this event just like a function; all we need to do is pass in a `GameInstance`:

```ts
const myGame = new GameInstance();
greet(myGame); // Adds "Hello, world!" to myGame's output
```

## The `on` Function

TODO: Write description here

```ts
const greet = on("GREET", game => {
    game.output.write("Hello, world!");
});
```

The `on` function used here is a helper function that generates an `EventFunction`