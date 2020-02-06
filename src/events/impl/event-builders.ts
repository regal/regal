/*
 * Contains functions for constructing and modifying game events.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../../state";
import {
    EventFunction,
    EventQueue,
    isEventQueue,
    isTrackedEvent,
    TrackedEvent
} from "../event-types";
import { buildEventQueue, buildThenMethod } from "./event-queue-impl";

/**
 * Creates an `EventQueue` that adds the events to the end of the game's internal queue,
 * meaning they will be executed after all of the currently queued events are finished.
 *
 * If the events are `EventQueue`s, any events in the queues' `immediateEvents`
 * collections will be concatenated, followed by any events in the queues' `delayedEvents`.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 * @param events The events to be added.
 * @returns An `EventQueue` that place all events in the `delayedEvent` array when invoked.
 */
export const enqueue = <InstanceConfig = any>(
    ...events: Array<TrackedEvent<InstanceConfig>>
): EventQueue<InstanceConfig> => {
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
 * If the events are `EventQueue`s, any events in the queues' `immediateEvents`
 * collections will be concatenated, followed by any events in the queues' `delayedEvents`.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 * @param events The events to be added.
 * @returns The `EventQueue` with all events in the queue's `delayedEvent` collection.
 */
export const nq = enqueue;

/**
 * Constructs a `TrackedEvent`, which is a function that modifies a `GameInstance`
 * and tracks all state changes as they occur.
 *
 * All modifications to game state within a Regal game should take place through a `TrackedEvent`.
 * This function is the standard way to declare a `TrackedEvent`.
 *
 * @template StateType The `GameInstance` state type. Optional, defaults to `any`.
 *
 * @param eventName The name of the `TrackedEvent`.
 * @param eventFunc The function that will be executed on a `GameInstance`.
 *
 * @returns The generated `TrackedEvent`.
 */
export const on = <InstanceConfig = any>(
    eventName: string,
    eventFunc: EventFunction<InstanceConfig>
): TrackedEvent<InstanceConfig> => {
    // Make the TrackedEvent callable like a function.
    const event = ((game: GameInstance) => {
        if (isEventQueue(eventFunc)) {
            game.events.invoke(eventFunc);
        } else {
            game.events.invoke(event);
        }
    }) as TrackedEvent;

    event.eventName = eventName;

    if (isTrackedEvent(eventFunc)) {
        event.target = () => eventFunc; // Boy oh boy this line gave me grief
    } else {
        event.target = eventFunc;
    }

    event.then = buildThenMethod(event);
    event.thenq = (...events: TrackedEvent[]) => event.then(enqueue(...events));

    return event;
};
