/*
 * Contains functions for constructing and modifying game events.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../../state";
import {
    EventFunction,
    EventQueue,
    isEventQueue,
    TrackedEvent
} from "../event-types";
import { buildEventQueue, buildThenMethod } from "../impl";

/**
 * Adds the events to the end of the game's event queue.
 *
 * If the events are `EventQueue`s, any events in the queues'
 * immediateEvents collections will be concatenated, followed
 * by any events in the queues' delayedEvents collections.
 *
 * @param events The events to be added.
 * @returns The `EventQueue` with all events in the queue's `delayedEvent` collection.
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
 * Adds the events to the end of the game's event queue. (Alias of `enqueue`)
 *
 * If the events are `EventQueue`s, any events in the queues'
 * immediateEvents collections will be concatenated, followed
 * by any events in the queues' `delayedEvents` collections.
 *
 * @param events The events to be added.
 * @returns The `EventQueue` with all events in the queue's `delayedEvent` collection.
 */
export const nq = enqueue;

/**
 * Creates a `TrackedEvent` around an `EventFunction`.
 *
 * @param eventName The name of the `TrackedEvent`.
 * @param eventFunc The `EventFunction` to be tracked.
 * @returns The generated `TrackedEvent`.
 */
export const on = (
    eventName: string,
    eventFunc: EventFunction
): TrackedEvent => {
    // Make the TrackedEvent callable like a function.
    const event = ((game: GameInstance) => {
        game.events.invoke(event);
    }) as TrackedEvent;

    event.eventName = eventName;
    event.target = eventFunc;

    event.then = buildThenMethod(event);
    event.thenq = (...events: TrackedEvent[]) => event.then(enqueue(...events));

    return event;
};
