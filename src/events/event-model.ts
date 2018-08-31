/**
 * Interfaces for the different types of events, and functions for manipulating them.
 *
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import GameInstance from "../game-instance";

/**
 * A function that modifies the game instance.
 * @param game The game instance to be modified.
 * @returns The next EventFunction to be executed.
 */
export type EventFunction = (game: GameInstance) => EventFunction;

/**
 * An EventFunction that is tracked by the game instance and can
 * be extended into an EventQueue.
 * @param game The game instance to be modified.
 * @returns The next EventFunction to be executed.
 */
export interface TrackedEvent extends EventFunction {
    (game: GameInstance): TrackedEvent | EventFunction;

    /** The name of the event. */
    eventName: string;

    /** The EventFunction that is wrapped by the TrackedEvent. */
    target: EventFunction;

    /**
     * Adds events to the front of the event queue.
     * @param events The events to be added.
     * @returns An EventQueue with the new events.
     */
    then(...events: TrackedEvent[]): EventQueue;

    /**
     * Adds events to the end of the event queue.
     *
     * Equivalent to calling <TrackedEvent>.then(nq(...events))
     * @param events The events to be added.
     * @returns An EventQueue with the new events.
     */
    thenq(...events: TrackedEvent[]): EventQueue;
}

/**
 * Contains a queue of TrackedEvents to be added to the game instance.
 */
export interface EventQueue extends TrackedEvent {
    /** The events to be added to the beginning of the game's event queue. */
    immediateEvents: TrackedEvent[];

    /** The events to be added to the end of the game's event queue. */
    delayedEvents: TrackedEvent[];

    /**
     * Adds events to the end of the event queue.
     * @param events The events to be added.
     * @returns An EventQueue with the new events.
     */
    enqueue(...events: TrackedEvent[]): EventQueue;

    /**
     * Adds events to the end of the event queue. (Alias of EventQueue.enqueue)
     * @param events The events to be added.
     * @returns An EventQueue with the new events.
     */
    nq(...events: TrackedEvent[]): EventQueue;
}

/** Ensures the object is a TrackedEvent. */
export const isTrackedEvent = (o: any): o is TrackedEvent =>
    (o as TrackedEvent).target !== undefined;

/** Ensures the object is an EventQueue. */
export const isEventQueue = (o: any): o is EventQueue =>
    (o as EventQueue).nq !== undefined;

/** "No operation" - reserved TrackedEvent that signals no more events. */
export const noop: TrackedEvent = (() => {
    const nonEvent = (game: GameInstance) => undefined;

    const event = nonEvent as TrackedEvent;

    event.eventName = "noop";
    event.target = nonEvent;

    return event;
})();

/** Creates a function that returns an error upon invocation. */
const illegalEventQueueInvocation = () => (game: GameInstance): undefined => {
    throw new RegalError("Cannot invoke an EventQueue.");
};

/**
 * Builds an EventQueue from the given collections of events.
 * @param immediateEvents The collection of events to be executed immediately.
 * @param delayedEvents The collection of events to be executed at the end of the queue.
 * @returns The EventQueue.
 */
const buildEventQueue = (
    immediateEvents: TrackedEvent[],
    delayedEvents: TrackedEvent[]
): EventQueue => {
    const eq = illegalEventQueueInvocation() as EventQueue;
    eq.target = illegalEventQueueInvocation();
    eq.then = thenConstructor(eq);
    eq.thenq = (...events: TrackedEvent[]) => eq.then(enqueue(...events));

    eq.enqueue = (...events: TrackedEvent[]): EventQueue => {
        const resultQueue = enqueue(...events);
        return buildEventQueue(
            eq.immediateEvents,
            eq.delayedEvents.concat(resultQueue.delayedEvents)
        );
    };
    eq.nq = eq.enqueue;

    eq.immediateEvents = immediateEvents;
    eq.delayedEvents = delayedEvents;

    return eq;
};

/**
 * Creates the `then` method for a TrackedEvent.
 * @param rootTarget The TrackedEvent.
 * @returns The `then` method.
 */
const thenConstructor = (rootTarget: TrackedEvent) => (
    ...events: TrackedEvent[]
): EventQueue => {
    // Build a helper function to call `then` for a single TrackedEvent.
    const singleThen = (
        target: TrackedEvent,
        arg: TrackedEvent
    ): EventQueue => {
        let targetImmediateEvents: TrackedEvent[];

        if (isEventQueue(target)) {
            // An EventQueue with at least one event in its delayedEvents collection cannot have its `then` method called.
            if (target.delayedEvents.length > 0) {
                throw new RegalError(
                    "Any enqueue instruction must happen at the end of the return statement."
                );
            }
            targetImmediateEvents = target.immediateEvents;
        } else {
            targetImmediateEvents = [target];
        }

        let argImmediateEvents: TrackedEvent[];
        let argDelayedEvents: TrackedEvent[];

        if (isEventQueue(arg)) {
            argImmediateEvents = arg.immediateEvents;
            argDelayedEvents = arg.delayedEvents;
        } else {
            argImmediateEvents = [arg];
            argDelayedEvents = [];
        }

        return buildEventQueue(
            targetImmediateEvents.concat(argImmediateEvents),
            argDelayedEvents
        );
    };

    // Call the helper `then` on every event, starting with the rootTarget.
    return events.reduce(singleThen, rootTarget) as EventQueue;
};

/**
 * Adds the events to the end of the game's event queue.
 *
 * If the events are EventQueues, any events in the queues'
 * immediateEvents collections will be concatenated, followed
 * by any events in the queues' delayedEvents collections.
 *
 * @param events The events to be added.
 * @returns The EventQueue with all events in the queue's delayedEvent collection.
 */
export const enqueue = (...events: TrackedEvent[]): EventQueue => {
    const argImmediateEvents: TrackedEvent[] = [];
    const argDelayedEvents: TrackedEvent[] = [];

    events.forEach(event => {
        if (isEventQueue(event)) {
            argImmediateEvents.push(...event.immediateEvents);
            argDelayedEvents.push(...event.delayedEvents);
        } else {
            argImmediateEvents.push(event);
        }
    });

    return buildEventQueue([], argImmediateEvents.concat(argDelayedEvents));
};

/**
 * Adds the events to the end of the game's event queue.
 *
 * If the events are EventQueues, any events in the queues'
 * immediateEvents collections will be concatenated, followed
 * by any events in the queues' delayedEvents collections.
 *
 * @param events The events to be added.
 * @returns The EventQueue with all events in the queue's delayedEvent collection.
 */
export const nq = enqueue;

/**
 * Creates a TrackedEvent around an EventFunction.
 * @param eventName The name of the TrackedEvent.
 * @param eventFunc The EventFunction to be tracked.
 * @returns The TrackedEvent.
 */
export const on = (
    eventName: string,
    eventFunc: EventFunction
): TrackedEvent => {
    // Make the TrackedEvent callable like a function.
    const event = ((game: GameInstance) => {
        game.events.invoke(event);
        return noop;
    }) as TrackedEvent;

    event.eventName = eventName;
    event.target = eventFunc;

    event.then = thenConstructor(event);
    event.thenq = (...events: TrackedEvent[]) => event.then(enqueue(...events));

    return event;
};
