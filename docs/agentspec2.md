# Agents

Games built on the Regal Framework consist of two main parts: *Event Functions* and *Agents*. Whereas Event Functions can be thought to describe any change that occurs within your game, Agents are the objects on which the changes take place.

Every object that is specific to a game's state -- weapons, players, trees, mountains, even intangible state like Score -- is considered an Agent.

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

Registering an agent adds it to the GameInstance's `agent` map. At this point, the `agent` map would look something like this:

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

If a sub-level agent is already registered, its pre-existing agent will be used instead. This allows for multiple references to the same agent.

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

Agents can also contain arrays of other agents. Much like agents that are properties of other agents, agents within lists can be registered when their top-level agent is registered or before.

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
```

Clearly, this is a problem. Even though we're registering agents with the game, we have no easy way to access them once we've lost the initial reference.

This is where `game.state` comes in. 