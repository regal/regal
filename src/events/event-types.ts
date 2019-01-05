/*
 * Interfaces for the different types of Regal game events.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";

/**
 * A function that modifies a game instance.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 * @param game The game instance to be modified.
 * @returns The next `EventFunction` to be executed, or `void` if there are no more events.
 */
export type EventFunction<StateType = any> = (
    game: GameInstance<StateType>
) => EventFunction<StateType> | void;

/**
 * An `EventFunction` that is tracked by the game instance.
 *
 * In order for Regal to behave properly, all modifications made by the game
 * developer to a `GameInstance` should be done through tracked events.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 * @param game The game instance to be modified.
 * @returns The next `EventFunction` to be executed.
 */
export interface TrackedEvent<StateType = any>
    extends EventFunction<StateType> {
    // Overload function signature
    (game: GameInstance<StateType>):
        | TrackedEvent<StateType>
        | EventFunction<StateType>;

    /** The name of the event. */
    eventName: string;

    /** The `EventFunction` that is wrapped by the `TrackedEvent`. */
    target: EventFunction<StateType>;

    /**
     * Adds events to the front of the event queue.
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    then(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;

    /**
     * Adds events to the end of the event queue.
     *
     * Equivalent to calling `<TrackedEvent>.then(nq(...events))`
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    thenq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;
}

/**
 * Contains a queue of `TrackedEvent`s to be executed sequentially.
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 */
export interface EventQueue<StateType = any> extends TrackedEvent<StateType> {
    /** The events to be added to the beginning of the game's event queue. */
    immediateEvents: Array<TrackedEvent<StateType>>;

    /** The events to be added to the end of the game's event queue. */
    delayedEvents: Array<TrackedEvent<StateType>>;

    /**
     * Adds events to the end of the event queue.
     * @param events The events to be added.
     * @returns A new `EventQueue` with the new events added to the queue.
     */
    enqueue(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;

    /**
     * Adds events to the end of the event queue. (Alias of `EventQueue.enqueue`)
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    nq(...events: Array<TrackedEvent<StateType>>): EventQueue<StateType>;
}

/** Ensures the object is a `TrackedEvent`. */
export const isTrackedEvent = (o: any): o is TrackedEvent =>
    o !== undefined && (o as TrackedEvent).target !== undefined;

/** Ensures the object is an `EventQueue`. */
export const isEventQueue = (o: any): o is EventQueue =>
    o !== undefined && (o as EventQueue).immediateEvents !== undefined;

/**
 * "No operation" - reserved `TrackedEvent` that signals no more events.
 * Use only in rare cases where an event cannot return `void`.
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
export type GameEventBuilder<StateType = any> = (
    eventName: string,
    eventFunc: EventFunction<StateType>
) => TrackedEvent<StateType>;
