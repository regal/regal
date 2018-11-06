import { RegalError } from "../../error";
import GameInstance from "../../game-instance";
import {
    EventFunction,
    EventQueue,
    isEventQueue,
    TrackedEvent
} from "../event-types";
import { enqueue } from "../func/event-funcs";

/** Builds an `EventFunction` that allows an `EventQueue` to be invoked like any other `EventFunction`. */
const queueInvocation = (
    immediateEvents: TrackedEvent[],
    delayedEvents: TrackedEvent[]
): EventFunction => (game: GameInstance) => {
    // Will seem like an EventQueue to the GameInstance, but has no additional methods
    const fauxQueue = {
        delayedEvents,
        immediateEvents
    } as EventQueue;

    game.events.invoke(fauxQueue);
};

/**
 * Builds an `EventQueue` from the given collections of events.
 *
 * @param immediateEvents The collection of events to be executed immediately.
 * @param delayedEvents The collection of events to be executed at the end of the queue.
 *
 * @returns The generated `EventQueue`.
 */
export const buildEventQueue = (
    immediateEvents: TrackedEvent[],
    delayedEvents: TrackedEvent[]
): EventQueue => {
    const queueInvocationFunction = queueInvocation(
        immediateEvents,
        delayedEvents
    );

    const eq = queueInvocationFunction as EventQueue;
    eq.target = queueInvocationFunction;

    eq.then = buildThenMethod(eq);
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
 * Creates the `then` method for a `TrackedEvent`.
 * @param rootTarget The `TrackedEvent` targeted by the new method.
 * @returns The `then` method.
 */
export const buildThenMethod = (rootTarget: TrackedEvent) => (
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
