# Things to Update in 0.4.0

## 1. Make all agents unusable until they are "registered" with the `GameInstance`.

There's no reason for agents to be mutable before they're being tracked. To streamline everything, agents should not be writable *or* readable until they are "registered" with the `GameInstance`.

The reason "registered" is in quotes is because that term is being deprecated (see below).

## 2. Replace `Agent.register` method with `GameInstance.using`.

The word "register" is unclear, and even *I'm* not sure when static agents need to be registered. Instead, `GameInstance.using` is called with all agents that are used in the event as arguments.

`GameInstance.using` can take a single agent as an argument, in which case it will return an agent of the same type. Otherwise, it can take an object with agents as properties; the returned object will have the same signature.

It is not required to call `using` on an agent that is already being tracked by the `GameInstance`, however doing so is harmless.

Implicit registration still applies.

### Examples

```ts
const move = (dir: MoveDirection, _target: MoveableAgent) =>
    on("MOVE", game => {
        const target = game.using(_target);
        // ...
    });
```

```ts
const ROOM = new Room("Cool Room");

const drop = (_item: Item) =>
    on("DROP", game => {
        const { item, room } = game.using({
            item: _item,
            room: ROOM
        });
        // ...
    });
```

## 3. Eliminate the `Agent.static` method and use context-aware instantiation

Since all agents are immutable until they're being used by the `GameInstance`, there no longer needs to be a functional differentation between static and nonstatic agents.

All agents, no matter the scope in which they're declared, must be tracked with the game instance before they can be used.

Agents declared outside the scope of an `EventFunction` (i.e. the instantiation happens at the same time the events themselves are defined) are considered to be part of the game's static context. Thus, the `StaticAgentRegistry` (while still useful) becomes more of a hidden optimization. 

Upon an agent's constructor being called, if the agent is in the game's static context, its properties will be added to the static agent registry. Otherwise, they will all be stored in the instance. Either way, `GameInstance.using` must be called with the agent before it can be used.

## 4. Add implicit agent tracking through `AgentArray`s.

This has been planned since July. Make it happen.

*See issue #6*

## 5. Optimize event sourcing with agent properties by making it optional

Event sourcing all agent properties, while a fun and successful experiment, will likely get out of hand quickly with large games. However, it's important to retain the initial values of every property per game cycle to keep immutability.

Therefore, there should be a way to toggle whether all changes to properties are tracked, or just the first and last. This toggle shall be a configuration option called `trackAgentChanges`.

## 6. Fix "Cannot invoke EventQueue" by allowing event queues to be passed into API Hooks

*See issue #30*

## 7. Scrub inaccessible agents when the game instance is cycled

When an agent is no longer referenced by any other agent, it is inaccessible. To save space, these agents should be deleted from the game instance (like garbage collection).

In order to maintain the revertable, event-sourcing model, this scrubbing cannot take place in the same cycle that the agent becomes inaccessible (although they may be flagged as such). Instead, the scrubbing should take place when the game instance is cycled on a new player command.

## 8. Remove required return from `EventFunction`

Make the returned `EventFunction` from an `EventFunction` optional so that `noop` doesn't have to be used as much.