# Agents

Games built on the Regal Framework consist of two main parts: *Event Functions* and *Agents*. Whereas Event Functions can be thought to describe any change that occurs within your game, Agents are the objects on which the changes take place.

Every object that is specific to a game's state -- weapons, players, trees, mountains, even intangible state like score -- is considered an agent.

## The `Agent` Class

Regal offers a class `Agent` that you can extend to create agent classes for your game. `Agent` has the following interface:

```ts
class Agent {
    constructor()
    register(game: GameInstance): this
    static(): this
}
```

The `register` and `static` methods will be explained shortly.

## Extending the Agent

Let's create an example agent (notice the lowercase 'a') called `Bucket`. We'll use the TypeScript constructor shorthand.

```ts
class Bucket extends Agent {
    constructor(public size: number, public contents: string, public full: boolean) {
        super(); // We need to invoke Agent's constructor
    }
}
```

Now, buckets can be instantiated and used just like any other TypeScript class.

```ts
const bucket = new Bucket(5, "water", true);
bucket.size === 5;
```

Furthermore, we can use them in Event Functions.

```ts
const pour = (bucket: Bucket) =>
    event("POUR", game => {
        if (bucket.full) {
            bucket.full = false;
            game.output.write(`You pour out the ${bucket.contents}.`);
        } else {
            game.output.write(`The bucket is empty!`);
        }
        return game;
});
```

At this point, we haven't demonstrated any benefit to using Agent classes. Enter the `register` method.

## Registering an Agent

One of the Regal Framework's core ideas is to represent games as deterministic pure functions. In other words, feeding an input to a game will return the same output every time, with no side effects.

In addition to a player's *command* (like "pour out bucket"), input includes the game's *current state*, or *instance state*, as well. If the player types "pour out bucket", we expect our game to behave differently if the bucket contains `water` versus if it contains `acid`. This is all part of what we consider the input.

A game's instance state is composed of agents. In the case above, our instance state would probably just need a single `Bucket`. However, more complicated games might have hundreds (or thousands!) of agents.

To add an agent to the instance state, we register it with the `GameInstance`. This is usually done right after we instantiate the agent. 

```ts
const init = event("INIT", game => {
    const waterBucket = new Bucket(5, "water", true);
    waterBucket.register(game);
    return game;
});
```

The `register` method returns the object that it's called on, so we can chain it if we want.

```ts
const waterBucket = new Bucket(5, "water", true).register(game);
```

Registering an agent adds it to the GameInstance's `agents` map. At this point, the `agents` map would look something like this:

```ts
game.agents === {
    1: {
        size: 5,
        contents: "water",
        full: true
    }
};
```

Wait, where did that 1 come from? When you register an agent, it is given a unique numeric ID. This is what Regal uses to track your agents.

Agents can only be registered once*, so an agent can have only one ID. Attempting to re-register an agent throws an error.

```ts
const waterBucket = new Bucket(5, "water", true).register(game); // OK
waterBucket.register(game); // throws RegalError: "Agent is already registered."
```

However, you can register as many unique agents as you'd like:

```ts
const waterBucket = new Bucket(5, "water", true).register(game);
const lavaBucket = new Bucket(3, "lava", true).register(game);

game.agents === {
    1: {
        size: 5,
        contents: "water",
        full: true
    },
    2: {
        size: 3,
        contents: "lava",
        full: true
    }
}
```

An agent's ID can be accessed with the `[ID]` symbol. If the agent has not been registered, the property will be undefined.

```ts
const waterBucket = new Bucket(5, "water", true);
waterBucket[ID] === undefined;

waterBucket.register(game);
waterbucket[ID] === 1;
```

_*See **Static Agents**._

## Complex Agents

In the real world, objects rarely only contain primitives like our `Bucket` class does. In reality, we would expect objects to contain other objects, arrays of objects, and so on.

Luckily, Regal accounts for this. Let's take a look at a few examples.

```ts
class BucketHolder extends Agent {
    constructor(public name: string, public bucket: Bucket) {
        super();
    }
}
```

Here, we've created an agent that contains another agent (a `Bucket`). We could compose this agent doing something like the following:

```ts
const waterBucket = new Bucket(5, "water", true).register(game);
const waterBoy = new BucketHolder("Water Boy", waterBucket).register(game);
```

Regal will automatically replace references to registered agents with their IDs, like so:

```ts
game.agents === {
    1: {
        size: 5,
        contents: "water",
        full: true
    },
    2: {
        name: "Water Boy",
        bucket: 1
    }
}
```

When composing an agent with other agents, however, we only have to register the top-level agent. All sub-level agents will automatically be registered when `register` is called on the top-level agent.

```ts
const waterBucket = new Bucket(5, "water", true);
const waterBoy = new BucketHolder("Water Boy", waterBucket).register(game);

waterBucket[ID] === 1;
```

If a sub-level agent is already registered, its pre-existing agent ID will be used instead of generating a new one. This allows for multiple references to the same agent.

```ts
const waterBucket = new Bucket(5, "water", true);
const waterBoy = new BucketHolder("Water Boy", waterBucket).register(game);
const well = new BucketHolder("Well", waterBucket).register(game);

game.agents === {
    1: {
        size: 5,
        contents: "water",
        full: true
    },
    2: {
        name: "Water Boy",
        bucket: 1
    },
    3: {
        name: "Well",
        bucket: 1
    }
}
```

Agents can also contain arrays of other agents. Much like agents that are properties of other agents, agents within arrays can be registered either when their top-level agent is registered, or before.

```ts
class MultiBucketHolder extends Agent {
    constructor(public name: string, public buckets: Bucket[]) {
        super();
    }
}

const waterBucket = new Bucket(5, "water", true).register(game);
const bucketRack = new MultiBucketHolder("Bucket Rack", [waterBucket, new Bucket(3, "lava", true)]).register(game);

game.agents === {
    1: {
        size: 5,
        contents: "water",
        full: true
    },
    2: {
        size: 3,
        contents: "lava",
        full: true
    },
    3: {
        name: "Bucket Rack",
        buckets: [
            1,
            2
        ]
    }
}
```

## Referencing Agents within the Instance State

Consider the following situation:

We have an event that constructs a bucket, presumably when the game is started, and an event that pours the bucket out:

```ts
const init = event("INIT", game => {
    const waterBucket = new Bucket(5, "water", true);
    waterBucket.register(game);
    return game;
});

const pour = (bucket: Bucket) =>
    event("POUR", game => {
        if (bucket.full) {
            bucket.full = false;
            game.output.write(`You pour out the ${bucket.contents}.`);
        } else {
            game.output.write(`The bucket is empty!`);
        }
        return game;
});
```

Calling `init(game)` will register `waterBucket` with `game`, but how do we get back the reference to `waterBucket`? For example, let's say we're parsing the user's input "pour out bucket":

```ts
const parse = (input: string) =>
    event("PARSE", game => {
        // ... other input checking ...

        if (input === "pour out bucket") {
            return pour(/* WHAT DO WE PUT HERE?? */)(game);
        }
});

let game = new GameInstance();
game = init(game); // Registers waterBucket
parse("pour out bucket") (game) // PROBLEM! (See above)
```

Clearly, this is a problem. Even though we're registering agents with the game, we have no easy way to access them once we've lost the initial reference.

This is where `state` comes in. `state` is an object of `any` type within the `GameInstance` class that allows us to maintain references to agents. To set or get an agent within `state`, simply use the dot operator with any member name.

```ts
game.state.bucket = waterBucket;
game.state.bucket.contents === "water";
```

If `state` doesn't contain the key, a RegalError will be thrown.

```ts
const bucket = game.state.buckte; // throws RegalError: "State does not contain member <buckte>."
```

By using `state`, we can solve the problem with references that was presented earlier:

```ts
const init = event("INIT", game => {
    const waterBucket = new Bucket(5, "water", true);
    game.state.bucket = waterBucket; // We store the waterBucket in the instance state at state.bucket
    return game;
});

const pour = (bucket: Bucket) =>
    event("POUR", game => {
        if (bucket.full) {
            bucket.full = false;
            game.output.write(`You pour out the ${bucket.contents}.`);
        } else {
            game.output.write(`The bucket is empty!`);
        }
        return game;
});

const parse = (input: string) =>
    event("PARSE", game => {
        // ... other input checking ...

        if (input === "pour out bucket") {
            const bucket: Bucket = game.state.bucket; // Grab the bucket from the state -- super easy!
            return pour(bucket)(game);
        }
});

let game = new GameInstance();
game = init(game); // Registers waterBucket
parse("pour out bucket") (game) // No worries!
```

Pretty straightforward. But did you notice anything odd? We removed the line `waterBucket.register(game)` from `init`. That wasn't unintentional -- it actually hints at a handy feature of agents, one that deserves its own section.

## Implicit Registration

Many agents that we've seen so far have needed to be *explicitly* registered with the GameInstance by calling something of the form `agent.register(game)`. This works fine, but Regal actually offers several ways to *implicitly* register agents. In other words, some other agent operations do the registration for us, eliminating the need to explicitly call `register`.

Here are some of the ways that an agent can be implicitly registered:

1. The agent is a property of some agent, referred to as the "top-level" agent, when the top-level agent is registered.

```ts
class Foo extends Agent { 
    constructor(public a: Agent) {
        super();
    }
}

class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const bar = new Bar("test");
const foo = new Foo(bar).register(game); // Implicitly registers bar
```

2. The agent is contained in an array that is a property of a top-level agent when the top-level agent is registered.

```ts
class Foo extends Agent { 
    constructor(public a: Agent[]) {
        super();
    }
}

class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const bar1 = new Bar("test1");
const bar2 = new Bar("test2");
const foo = new Foo([bar1, bar2]).register(game); // Implicitly registers bar1 and bar2
```

3. The agent is assigned to a property of a previously registered agent.

```ts
class Foo extends Agent { 
    constructor(public a: Agent) {
        super();
    }
}

class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const foo = new Foo(undefined).register(game);
foo.a = new Bar("test"); // Implicitly registers the Bar instance
```

4. The agent is part of an array that is assigned to a property of a previously registered agent.

```ts
class Foo extends Agent { 
    constructor(public a: Agent[]) {
        super();
    }
}

class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const foo = new Foo([]).register(game);

const bar1 = new Bar("test1");
const bar2 = new Bar("test2");
foo.a = [bar1, bar2]; // Implicitly registers bar1 and bar2
```

5. The agent is added to an array that is a property of a previously registered agent.

```ts
class Foo extends Agent { 
    constructor(public a: Agent[]) {
        super();
    }
}

class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const foo = new Foo([]).register(game);

const bar = new Bar("test");
foo.a.push(bar1); // Implicitly registers bar
```

6. The agent is assigned to a reference within the GameInstance's `state` property.

```ts
class Bar extends Agent {
    constructor(public s: string) {
        super();
    }
}

const game = new GameInstance();
const bar = new Bar("test");
game.state.foo = bar; // Implicitly registers bar
```

These rules apply recursively, meaning that we can register large compositions of agents without even having to call `register`.

```ts
const armor = new Armor("Shining Armor", Materials.STEEL, 10);
const broadsword = new MeleeWeapon("Broadsword", 2, 8);
const knight = new Human("Knight", armor);
knight.equip(broadsword);
game.state.fighters += knight; // Registers armor, broadsword, and knight!
```

## Non-Agents in the Instance State

In addition to agents, the GameInstance's `state` object can contain primitives (like `string`, `number`, and `boolean`) and arrays. That's because `state` is actually (*gasp!*) itself an agent.

This can be useful for storing instance state-specific values:

```ts
game.state.livesRemaining = 15;
```

Or arrays of agents:

```ts
game.state.enemies = [orc1, orc2, jimCarrey];
```

As with any agent, `state` can contain objects that don't inherit from `Agent`, but it's not recommended because you'll miss out on the benefits of using agents.

## Benefits of Using Agents

Agents were designed to provide a common way to track and manage every change that happens within a game's state.

Pretend you have a complex game with hundreds of EventFunctions and dozens of classes, all of which are plain JavaScript objects. Consider the following three scenarios:

1. When the player enters a command, such as "throw football", your game crashes -- but only sometimes. After spending hours debugging, you manage to reproduce the bug: at some point, the player's football became `undefined`. It must've been a side effect of another command, but you have no way of knowing which.

2. The player enters the command "fire blaster at ship". Your game parses the command and executes the `fire` event, which decrements the player's ammo, increases the player's sharpshooting skill, and queues a `hit` event on the ship. By the time the `hit` occurs, however, the reference to the ship no longer exists (probably due to a bug in your code). This reports an error to the player and asks them to try again, but now the state was already modified by the illegal command.

3. Many interactive fiction games allow the user to "undo" a command if they don't like the results. If your game uses plain JavaScript objects as its state, an `undo` EventFunction would be difficult to implement.

Agents solve each of these problems, as you'll see in the next sections.

### Tracking Changes with Agents

In scenario (1) of the previous section, the game developer had a tough time tracking down a buggy event that deleted one of their agents' properties.

Agents prevent this issue by keeping a log of every change that happens to their state, which is stored in the GameInstance's `events` array.

Here it is in action:

```ts
class Dummy extends Agent {
    constructor(public name: string, public health: number) { super(); }
}

const heal = (target: Dummy, amount: number) =>
    event("HEAL", game => {
        target.health += amount;
        game.output.write(`Healed ${target.name} by ${amount}. Health is now ${target.health}.`);
        return game;
});
const start = event("START", game => {
    game.state.player = new Dummy("Lars", 10);
    return game;
});

let game = new GameInstance();
game = start(game);
game = heal(game.state.player, 15) (game);

game.output === [ "Healed Lars by 15. Health is now 25." ];
game.events === [
    {
        id: 1, // Event ID
        name: "HEAL",
        changes: [
            {
                agent: 1, // Agent ID
                property: "health",
                action: "MOD",
                start: 10,
                end: 25
            }
        ]
    }
];
```

Every change made to any agent registered within a GameInstance is recorded like this in the `events` array. This is extremely helpful for debugging.

For more information, see the `GameInstance.events` specification page.

### Transactions and Immutability with Agents

(TBA)

## Static Agents

(TBA)