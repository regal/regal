/**
 * Interfaces for the different types of Regal game events.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";

/**
 * A function that modifies the game instance.
 *
 * @param game The game instance to be modified.
 * @returns The next `EventFunction` to be executed, or `void` if there are no more events.
 */
export type EventFunction = (game: GameInstance) => EventFunction | void;

/**
 * An `EventFunction` that is tracked by the game instance and can
 * be extended into an `EventQueue`.
 *
 * @param game The game instance to be modified.
 * @returns The next `EventFunction` to be executed.
 */
export interface TrackedEvent extends EventFunction {
    (game: GameInstance): TrackedEvent | EventFunction;

    /** The name of the event. */
    eventName: string;

    /** The `EventFunction` that is wrapped by the `TrackedEvent`. */
    target: EventFunction;

    /**
     * Adds events to the front of the event queue.
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    then(...events: TrackedEvent[]): EventQueue;

    /**
     * Adds events to the end of the event queue.
     *
     * Equivalent to calling `<TrackedEvent>.then(nq(...events))`
     *
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    thenq(...events: TrackedEvent[]): EventQueue;
}

/**
 * Contains a queue of `TrackedEvents` to be added to the game instance.
 */
export interface EventQueue extends TrackedEvent {
    /** The events to be added to the beginning of the game's event queue. */
    immediateEvents: TrackedEvent[];

    /** The events to be added to the end of the game's event queue. */
    delayedEvents: TrackedEvent[];

    /**
     * Adds events to the end of the event queue.
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    enqueue(...events: TrackedEvent[]): EventQueue;

    /**
     * Adds events to the end of the event queue. (Alias of `EventQueue.enqueue`)
     * @param events The events to be added.
     * @returns An `EventQueue` with the new events.
     */
    nq(...events: TrackedEvent[]): EventQueue;
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
