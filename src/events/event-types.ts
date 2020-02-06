/*
 * Interfaces for the different types of Regal game events.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";

type TypedGameInstance<InstanceConfig> = InstanceConfig extends GameInstance
    ? InstanceConfig
    : GameInstance<InstanceConfig>;

/**
 * A function that modifies a game instance.
 *
 * @template InstanceConfig
 * @param game The game instance to be modified.
 * @returns The next `EventFunction` to be executed, or `void` if there are no more events.
 */
export type EventFunction<InstanceConfig = any> = (
    game: TypedGameInstance<InstanceConfig>
) => EventFunction<InstanceConfig> | void;

/**
 * An `EventFunction` that is tracked by the game instance.
 *
 * In order for Regal to behave properly, all modifications of game state
 * should take place inside tracked events.
 *
 * Just like an `EventFunction`, a `TrackedEvent` can be invoked as a
 * function by passing in a `GameInstance` for its only argument.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 * @param game The game instance to be modified.
 * @returns The next `TrackedEvent` or `EventFunction` to be invoked on the `GameInstance`.
 */
export interface TrackedEvent<InstanceConfig = any>
    extends EventFunction<InstanceConfig> {
    // Overload function signature
    (game: TypedGameInstance<InstanceConfig>):
        | TrackedEvent<InstanceConfig>
        | EventFunction<InstanceConfig>;

    /** The name of the event. */
    eventName: string;

    /** The `EventFunction` that is wrapped by the `TrackedEvent`. */
    target: EventFunction<InstanceConfig>;

    /**
     * Adds events to the front of the event queue.
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    then(
        ...events: Array<TrackedEvent<InstanceConfig>>
    ): EventQueue<InstanceConfig>;

    /**
     * Adds events to the end of the event queue.
     *
     * Equivalent to calling `trackedEvent.then(nq(...events))`.
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    thenq(
        ...events: Array<TrackedEvent<InstanceConfig>>
    ): EventQueue<InstanceConfig>;
}

/**
 * Contains a queue of `TrackedEvent`s to be executed sequentially.
 * @template InstanceConfig The `GameInstance` state type. Optional, defaults to `any`.
 */
export interface EventQueue<InstanceConfig = any>
    extends TrackedEvent<InstanceConfig> {
    /** The events to be added to the beginning of the game's event queue. */
    immediateEvents: Array<TrackedEvent<InstanceConfig>>;

    /** The events to be added to the end of the game's event queue. */
    delayedEvents: Array<TrackedEvent<InstanceConfig>>;

    /**
     * Adds events to the end of the event queue.
     * @param events The events to be added.
     * @returns A new `EventQueue` with the new events added to the queue.
     */
    enqueue(
        ...events: Array<TrackedEvent<InstanceConfig>>
    ): EventQueue<InstanceConfig>;

    /**
     * Adds events to the end of the event queue. (Alias of `EventQueue.enqueue`)
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    nq(
        ...events: Array<TrackedEvent<InstanceConfig>>
    ): EventQueue<InstanceConfig>;
}

/** Ensures the object is a `TrackedEvent`. */
export const isTrackedEvent = (o: any): o is TrackedEvent =>
    o !== undefined && (o as TrackedEvent).target !== undefined;

/** Ensures the object is an `EventQueue`. */
export const isEventQueue = (o: any): o is EventQueue =>
    o !== undefined && (o as EventQueue).immediateEvents !== undefined;

/**
 * Reserved `TrackedEvent` that signals no more events.
 *
 * `noop` is short for *no operation*.
 *
 * Meant to be used in rare cases where an event cannot return `void`
 * (e.g. forced by the TypeScript compiler).
 */
export const noop: TrackedEvent = (() => {
    const nonEvent = (game: GameInstance) => undefined;

    const event = nonEvent as TrackedEvent;

    event.eventName = "noop";
    event.target = nonEvent;

    return event;
})();

/**
 * Type alias for the `on` function, which creates a `TrackedEvent`.
 *
 * Used for situations where the game developer wants to refer to
 * a parameterized version of `on` as its own function. For example:
 *
 * `const o: GameEventBuilder<CustomStateType> = on;`
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 */
export type GameEventBuilder<InstanceConfig = any> = (
    eventName: string,
    eventFunc: EventFunction<InstanceConfig>
) => TrackedEvent<InstanceConfig>;
