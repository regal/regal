# Events

A game where eveything stays the same isn't much of a game. Therefore, **Regal** provides *events*.

An *event* can be thought of as any change that occurs within your game. Any time the state of your game changes, it is contained in an event. This guide will help you use events in your game.

## Event Functions

The *Event Function* is one of **Regal**'s central ideas.

An `EventFunction` takes a `GameInstance` as an argument, modifies it, and returns the next `EventFunction` to be executed.

An `EventFunction`'s contract looks like this:

```ts
type EventFunction = (game: GameInstance) => EventFunction;
```

Every *event* in a Regal game is actually an `EventFunction`.

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

Although that's a perfectly valid use of an `EventFunction`, **Regal** offers a function called `on` that wraps your events with some useful metadata and make executing multiple events easier.

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

Since we used `on`, some useful metadata was stored in `game.events.history`.

```ts
myGame.events.history === [
    {
        id: 1, // Auto-generated event ID
        name: "GREET",
        output: [
            "Hello, world!"
        ]
    }
];
```

This is just a small sample of what is gained when you track your events with `on`. It is highly recommended that you build your events this way.

## Partially Applied Events

Often, you'll want the effects of an event to be configurable whenever the event is used. This is done through a technique called **partial application**, in which the arguments of a function are applied at different times.

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
greet("Regal")(myGame); // Create an EventFunction where name == "Regal", then execute it

myGame.events.history === [
    {
        id: 1,
        name: "GREET",
        output: [
            "Hello, Regal!" // Our custom output
        ]
    }
];
```

For even more fun, we can use **string templating** to let the event's name reflect its unique arguments.

```ts
const greet = (name: string) =>
    on(`GREET <${name}>`, game => {
        game.output.write(`Hello, ${name}!`);
        return noop;
    });

const myGame = new GameInstance();
greet("Regal")(myGame);

myGame.events.history === [
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

As stated earlier, an `EventFunction` returns another `EventFunction`. This tells the event executor that another event should be executed on the game instance.

Here is an example of an `EventFunction` causing another:

```ts
const morning = on("MORNING", game => {
    game.output.write("Have a great day!");
    return noop;
});

const afternoon = on("AFTERNOON", game => {
    game.output.write("Keep it up!");
    return noop;
});

const motivate = (date: Date) =>
    on("MOTIVATE", game => {
        return (date.getHours() < 12) ? morning : afternoon;
    });
```

When the `motivate` event is executed, it checks the value of its `date` argument to determine which event should be executed next.

```ts
const myGame = new GameInstance();
const myDate = new Date("August 5, 2018 10:15:00");

motivate(myDate)(myGame);
myGame.events.history === [
    {
        id: 2,
        causedBy: 1, // MOTIVATE (1) caused MORNING (2)
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

It's also possible to have one `EventFunction` cause multiple events.

There are two ways this can be done: immediately with `EventFunction.then` and delayed with `enqueue`.

### Immediate Execution with `EventFunction.then`

To have one event be executed immediately after another, use the `EventFunction.then` method. This is useful in situations where multiple events should be executed in direct sequence.

To demonstrate, here's an example of a player crafting a sword. When the `makeSword` event is executed, the sword is immediately added to the player's inventory (`addItemToInventory`) and the player learns the blacksmithing skill (`learnSkill`).

```ts
const learnSkill = (name: string, skill: string) =>
    on(`LEARN SKILL <${skill}>`, game => {
        game.output.write(`${name} learned ${skill}!`);
        return noop;
    });

const addItemToInventory = (name: string, item: string) =>
    on(`ADD ITEM <${item}>`, game => {
        game.output.write(`Added ${item} to ${name}'s inventory.`);
        return noop;
    });

const makeSword = (name: string) =>
    on(`MAKE SWORD`, game => {
        game.output.write(`${name} made a sword!`);
        return learnSkill(name, "Blacksmithing")
            .then(addItemToInventory(name, "Sword"));
    });
```

`GameInstance.events.history` contains the list of events that occurred, in reverse chronological order.

```ts
const myGame = new GameInstance();

makeSword("King Arthur")(myGame);
myGame.events.history === [
    {
        id: 3,
        causedBy: 1,
        name: "LEARN SKILL <Blacksmithing>",
        output: [
            "King Arthur learned Blacksmithing!"
        ]
    },
    {
        id: 2,
        causedBy: 1,
        name: "ADD ITEM <Sword>",
        output: [
            "Added Sword to King Arthur's inventory."
        ]
    },
    {
        id: 1,
        name: "MAKE SWORD",
        output: [
            "King Arthur made a sword!"
        ]
        caused: [
            2, 3
        ]
    }
]
```

### Delayed Execution with `enqueue`

To schedule an event to be executed after all of the immediate events are finished, use the `enqueue` function. This is useful in situations where you have multiple series of events, and you want each series to execute their events in the same "round."

This is best illustrated with an example:

```ts
const hitGround = (item: string) =>
    on("HIT GROUND <item>", game => {
        game.output.write(`${item} hits the ground. Thud!`);
        return noop;
    });

const fall = (item: string) =>
    on("FALL <item>", game => {
        game.output.write(`${item} falls.`);
        return enqueue(hitGround(item));
    });

const drop = (items: string[]) =>
    on("DROP ITEMS", game => {
        let queue = enqueue();
        for (let item in items) {
            queue = queue.enqueue(fall(item));
        }
        return queue;
    });
```

We'll walk through each line, starting from the `drop` function.

```ts
const drop = (items: string[]) =>
    on("DROP ITEMS", game => {
```

Our top-level event function `drop` takes in a list of items that are being dropped.

```ts
        let queue = enqueue();
```

The `enqueue` function takes zero or more `EventFunction`s as arguments, which it uses to build a special type of `EventFunction` called an `EventQueue`. Creating an empty queue has no effect; it simply provides us a reference to add additional events shortly.

```ts
        for (let item in items) {
            queue = queue.enqueue(fall(item));
        }
```

In addition to being a standalone function, `enqueue` is also a method of `EventQueue`. Calling `EventQueue.enqueue` returns a new `EventQueue` which contains the all previously enqueued events plus the new event(s).

The previous two code blocks could be simplified using JavaScript's `map` function like so:

```ts
const queue = enqueue(items.map(item => fall(item)));
```

Finally, we return the event queue.

```ts
        return queue;
    });
```

The `fall` event is simpler:

```ts
const fall = (item: string) =>
    on("FALL <item>", game => {
        game.output.write(`${item} falls.`);
        return enqueue(hitGround(item));
    });
```

For each item that was dropped, we write an output message describing that item falling, and then we `enqueue` an event for that item hitting the ground.

```ts
const hitGround = (item: string) =>
    on("HIT GROUND <item>", game => {
        game.output.write(`${item} hits the ground. Thud!`);
        return noop;
    });
```

All said and done, an execution of this group of events would look something like this:

```ts
const myGame = new GameInstance();
const items = ["Hat", "Duck", "Spoon"];

drop(items)(myGame);

// myGame's output would print in this order:
// Hat falls.
// Duck falls.
// Spoon falls.
// Hat hits the ground. Thud!
// Duck hits the ground. Thud!
// Spoon hits the ground. Thud!
```

If you're still confused about the differene between `then` and `enqueue`, here is what the output would have been if `then` was used instead:

```ts
// Hat falls.
// Hat hits the ground. Thud!
// Duck falls.
// Duck hits the ground. Thud!
// Spoon falls.
// Spoon hits the ground. Thud!
```

Remember, `enqueue` is useful for situations where you have multiple series of events, like our [`fall` -> `hitGround`] series, and you want each series to execute their alike events in the same "round." We didn't want `hat` to `fall` and then `hitGround`, *then* `duck` to `fall` and then `hitGround`, etc; we wanted *all of the items to fall together*, and then all of them to hit the ground together.

If you wanted the opposite, (say you wanted `hat` to be done with hitting the ground before `duck` fell), then you would use `then`.

`then` is for immediate execution; `enqueue` is for delayed exeuction.

Events are added to the end of the event queue as soon as the `EventQueue` function is executed.

#### `enqueue` Shorthand

If you'd like, you can use the shorthand `nq` instead of writing `enqueue`. We're all about efficiency. :+1:

```ts
const queue = nq([event1, event2]);
queue.nq(event3);
```

### Definitions

(TODO: Move this section)

* An `EventFunction` is a function type that accepts a `GameInstance` and returns an `EventFunction`, called the *return function*.
* The *return function* is caused by the *cause function*.

* Wrapping an `EventFunction` with `on` creates a special type of `EventFunction` called a `TrackedEvent`.
* A `TrackedEvent` is tracked by `GameInstance.events` and has methods `then` and `thenq`.

* An `EventQueue` is a special type of `TrackedEvent` that contains multiple `EventFunction`s.
* An `EventQueue` has method `enqueue` (and its alias `nq`).
* An `EventQueue` contains two collections of `EventFunctions`: *immediate* events and *delayed* events.
* When a return function is an `EventQueue`, the `EventQueue`'s *immediate* events are placed at the beginning of `GameInstance.events._queue` and *delayed* events are placed at the end.

* A `TrackedEvent` that has not been modified can considered an `EventQueue` with one event in its immediate event collection. (Except it does not have the `enqueue` method.)

* When `TrackedEvent.then(event: TrackedEvent)` is called, an `EventQueue` is created. The event(s) contained in the target `TrackedEvent`'s and the `event` argument's immediate event collections are combined to create the new `EventQueue`'s immediate event collection. 
    * The events in the `event` argument's delayed event collection are carried over to create the new `EventQueue`'s delayed event collection.
    * If `TrackedEvent.then` is called and the target's delayed event collection is not empty, an error will be thrown.

* `TrackedEvent.then(eventA, eventB, eventC...: TrackedEvent[])` is equivalent to `TrackedEvent.then(eventA).then(eventB).then(eventC)`.

* There exists a standalone function `enqueue` (and its alias `nq`) that accepts zero or more `TrackedEvent`s.
* When `enqueue(...events: TrackedEvent[])` is called, an `EventQueue` is created. The event(s) contained in the `...events` argument are combined to create the new `EventQueue`'s delayed event collection.
    * If the `...events` have events in both their immediate and delayed event collections, the immediate events will be concatenated, followed by the delayed events.

* When `EventQueue.enqueue(...events: TrackedEvent[])` is called, an `EventQueue` is created. The event(s) contained in the target `EventQueue`'s delayed event collection and the event(s) contained in the `...events` argument are combined to create the new `EventQueue`'s delayed event collection.
    * If the `...events` have events in both their immediate and delayed event collections, the immediate events will be concatenated, followed by the delayed events.
    * If the target `EventQueue` has events in its immediate event collection, those events are carried over to the new `EventQueue`'s immediate event collection.

* `enqueue(eventA, eventB, eventC...: TrackedEvent[])` is equivalent to `enqueue(eventA).nq(eventB).nq(eventC)`, which is equivalent to `enqueue(eventA).nq(eventB, eventC)`.

* `TrackedEvent.thenq(...events: TrackedEvent[])` is a shorthand for `TrackedEvent.then(nq(...events: TrackedEvent[]))`.

## Tracking Agent Changes by Event

In addition to what we've covered, `GameInstance.events.history` tracks all changes made to registered agents over the course of each event as well.

Here's an example using a basic agent:

```ts
class Dummy extends Agent {
    constructor(public name: string, public health: number) { 
        super(); 
    }
}
```

And an event that modifies the agent:

```ts
const heal = (target: Dummy, amount: number) =>
    on("HEAL", game => {
        target.health += amount;

        game.output.write(`Healed ${target.name} by ${amount}. Health is now ${target.health}.`);

        return noop;
    });
```

When `heal` is executed, we see a log of the changes reflected in `GameInstance.events.history`.

```ts
const myGame = new GameInstance();
const dummy = new Dummy("Lars", 10);

heal(dummy, 15)(game);

game.events.history === [
    {
        id: 1,
        name: "HEAL",
        output: [
            "Healed Lars by 15. Health is now 25."
        ],
        changes: [
            {
                agentId: 1,
                op: "MODIFIED",
                init: 10,
                final: 25,
                property: "health"
            }
        ]
    },
];
```
(For more information on agents, see the agent guide.)