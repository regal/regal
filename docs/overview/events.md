# Events

A game where eveything stays the same isn't much of a game. Therefore, **Regal** provides *events*.

An *event* can be thought of as any change that occurs within your game. Any time the state of your game changes, it is contained in an event. This guide will help you use events in your game.

## Event Functions

The *Event Function* is one of **Regal**'s central ideas.

An *Event Function* takes a `GameInstance` as an argument, modifies it, and returns any resulting `EventFunction`s.

An `EventFunction`'s contract looks like this:

```ts
type EventFunction = (game: GameInstance) => EventFunction;
```

Every *event* is actually an `EventFunction`.

## Your First Event

A very basic event might look like this:

```ts
const greet: EventFunction = (game: GameInstance) => {
    game.output.write("Hello, world!");
    return noop;
}
```

This event takes in a `GameInstance` and writes "Hello, world!" to its output. `noop` is a special type of `EventFunction` that stands for *no operation*. It simply tells the event executor that there are no more events.

We could call this event just like a function; all we need to do is pass in a `GameInstance`:

```ts
const myGame = new GameInstance();
greet(myGame); // Adds "Hello, world!" to myGame's output
```

## The `on` Function

Although that's a perfectly valid use of an `EventFunction`, **Regal** offers a function called `on` that wraps your events with some useful metadata.

```ts
on(eventName: string, eventFunc: EventFunction): EventFunction;
```

The event from our previous example could be written with `on` like this:

```ts
const greet = on("GREET", game => {
    game.output.write("Hello, world!");
    return noop;
});
```

The resulting `EventFunction` is called exactly like our previous example, as well.

```ts
const myGame = new GameInstance();
greet(myGame); // Adds "Hello, world!" to myGame's output
```

However, this stores some helpful metadata in `game.events.list`.

```ts
myGame.events.list === [
    {
        id: 1, // Auto-generated event ID
        name: "GREET",
        output: [
            "Hello, world!"
        ]
    }
];
```

This is just a small sample of what is added when you track your events with `on`. It is highly recommended that you build your events this way.

## Partially Applied Events

It often happens that you'll want the effects of an event to be configurable whenever the event is used. This is done through a technique called **partial application**, in which the arguments of a function are applied at different times.

For example, we could use partial application to create a generic version of our `greet` event:

```ts
const greet = (name: string) =>
    on("GREET", game => {
        game.output.write(`Hello, ${name}!`);
        return noop;
    });
```

Now, `greet` can take any `name` and will generate an `EventFunction` using that argument.

```ts
const myGame = new GameInstance();
greet("Regal")(myGame); // Create an EventFunction where name = "Regal"

myGame.events.list === [
    {
        id: 1,
        name: "GREET",
        output: [
            "Hello, Regal!" // Our custom output
        ]
    }
];
```

For even more fun, we can use **string templating** to let the event's name reflect its unique arguments!

```ts
const greet = (name: string) =>
    on(`GREET <${name}>`, game => {
        game.output.write(`Hello, ${name}!`);
        return noop;
    });

const myGame = new GameInstance();
greet("Regal")(myGame);

myGame.events.list === [
    {
        id: 1,
        name: "GREET <Regal>", // Unique name!
        output: [
            "Hello, Regal!"
        ]
    }
];
```

## Causing Additional Events

```ts
const morning = on("MORNING", event => {
    game.output.write("Have a great day!");
    return noop;
});

const afternoon = on("AFTERNOON", event => {
    game.output.write("Keep it up!");
    return noop;
});

const motivate = (date: Date) =>
    on("MOTIVATE", game => {
        return (date.getHours() < 12) ? morning : afternoon;
    });

const myGame = new GameInstance();
const myDate = new Date("August 5, 2018 10:15:00");

motivate(myDate)(myGame);
myGame.events.list === [
    {
        id: 2,
        causedBy: 1,
        name: "MORNING",
        output: [
            "Have a great day!"
        ]
    },
    {
        id: 1,
        name: "MOTIVATE",
        caused: [
            2
        ]
    }
]
```

## Causing Multiple Events

### Using `pipe`

### Using `queue`

## Tracking Agent Changes by Event