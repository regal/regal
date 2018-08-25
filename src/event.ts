/**
 * Model for game events in the Regal Game Library.
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
 */

import GameInstance from './game-instance';
import { PropertyChange, PropertyOperation } from './agent';
import { OutputLine } from './output';
import { RegalError } from './error';

/** Event ID for untracked EventFunctions. */
export const DEFAULT_EVENT_ID: number = 0;
/** Name of untracked EventFunctions.*/
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

/**
 * A function that modifies the game instance.
 * @param game The game instance to be modified.
 * @returns The next EventFunction to be executed.
 */
export interface EventFunction { 
    (game: GameInstance): EventFunction;
}

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
    (<TrackedEvent>o).target !== undefined;

/** Ensures the object is an EventQueue. */
export const isEventQueue = (o: any): o is EventQueue =>
    (<EventQueue>o).nq !== undefined;

/** "No operation" - reserved TrackedEvent that signals no more events. */
export const noop: TrackedEvent = (() => {
    const nonEvent = (game: GameInstance) => undefined;

    const event = <TrackedEvent>(nonEvent);

    event.eventName = "noop";
    event.target = nonEvent;

    return event;
})();

/**
 * Record of a TrackedEvent's effects in a game cycle.
 */
export class EventRecord {

    /** The IDs of the OutputLines emitted by the event. */
    output?: number[];
    /** The ID of the event that caused this event. */
    causedBy?: number;
    /** The IDs of the events that were caused by this event. */
    caused?: number[];
    /** The records of all changes to registered agents that were caused by this event. */
    changes?: PropertyChange[];

    /** Default EventRecord for untracked EventFunctions. */
    static default = new EventRecord();

    /**
     * Constructs a new EventRecord.
     * @param id The event's unique numeric ID.
     * @param name The event's name.
     * @param func The event's TrackedEvent.
     */
    constructor(
        public id: number = DEFAULT_EVENT_ID, 
        public name: string = DEFAULT_EVENT_NAME, 
        public func: TrackedEvent = noop
    ) {}

    /**
     * Appends a reference to an OutputLine to the EventRecord's output log.
     * @param line The line of output emitted by the event.
     */
    trackOutputWrite(line: OutputLine): void {
        if (this.output === undefined) {
            this.output = [];
        }
        this.output.push(line.id);
    }

    /**
     * Creates an association between this EventRecord and the caused events,
     * setting the caused events' causedBy properties to this EventRecord's ID, and
     * appending the events' IDs to this EventRecord's caused property.
     * @param events The events that were caused by this event.
     */
    trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id));
        events.forEach(e => e.causedBy = this.id);
    }

    /**
     * Adds a record of a single change to a registered agent's property to the
     * EventRecord's changes property.
     * @param agentId The registered agent's ID.
     * @param property The property being modified.
     * @param op The type of modification.
     * @param init The initial value of the property.
     * @param final The final value of the property.
     */
    trackChange<T>(agentId: number, property: PropertyKey, op: PropertyOperation, init?: T, final?: T): void {
        if (this.changes === undefined) {
            this.changes = [];
        }
        this.changes.push({
            agentId,
            op,
            property: property.toString(),
            init,
            final
        });
    }
}

/**
 * Manager for all events in a GameInstance.
 */
export class InstanceEvents {

    /** Contains records of the past events executed during the game cycle. */
    history: EventRecord[] = [];

    /** ID of the most recently generated EventRecord. */
    private _lastEventId = DEFAULT_EVENT_ID;
    /** Internal queue of events that have yet to be executed. */
    private _queue: EventRecord[] = [];

    /**
     * Constructs an InstanceEvents.
     * @param game The game instance that owns this InstanceEvents.
     */
    constructor(public game: GameInstance) {}

    /** The current EventRecord. */
    get current(): EventRecord {
        let event = this._queue[0];

        if (event === undefined) {
            event = EventRecord.default;
        }

        return event;
    }

    /**
     * Executes the given event and all events caused by it.
     * @param event The TrackedEvent to be invoked.
     */
    invoke(event: TrackedEvent): void {
        this._addEvent(event);
        this._executeCurrent();
    }

    /**
     * Adds the event to the internal queue. If the event is an EventQueue,
     * the event's immediateEvents are added to the front of the queue
     * and the delayedEvents are added to the back of the queue.
     * @param event The TrackedEvent to be added to the queue.
     * @param cause The EventRecord to be recorded as the event's cause (optional).
     */
    _addEvent(event: TrackedEvent, cause?: EventRecord): void {
        let immediateEvents: TrackedEvent[];
        let delayedEvents: TrackedEvent[];

        if (isEventQueue(event)) {
            immediateEvents = event.immediateEvents;
            delayedEvents = event.delayedEvents;
        } else {
            immediateEvents = [event];
            delayedEvents = [];
        }

        const mapToRecord = (event: TrackedEvent) =>
            new EventRecord(++this._lastEventId, event.eventName, event);

        const immediateEventRecords = immediateEvents.map(mapToRecord);
        const delayedEventRecords = delayedEvents.map(mapToRecord);

        if (cause) {
            cause.trackCausedEvent(...immediateEventRecords);
            cause.trackCausedEvent(...delayedEventRecords);
        }

        this._queue = immediateEventRecords.concat(this._queue);
        this._queue = this._queue.concat(delayedEventRecords);
    }

    /**
     * Executes the current EventRecord and recursively exeuctes
     * all remaining EventRecords in the queue.
     */
    _executeCurrent(): void {
        const current = this.current;
        const nextEvent = current.func.target(this.game);
        this._archiveCurrent();

        // Add the nextEvent to the internal queue, if necessary.
        if (isTrackedEvent(nextEvent) && nextEvent !== noop) {
            this._addEvent(nextEvent, current);
        }

        // While the queue is not empty, keep executing.
        if (this._queue.length > 0) {
            this._executeCurrent();
        }
    }

    /**
     * Deletes unnecessary data from the current EventRecord
     * and moves it to the history array.
     */
    _archiveCurrent(): void {
        delete this.current.func;
        this.history.unshift(this._queue.shift());
    }
}

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
const buildEventQueue = (immediateEvents: TrackedEvent[], delayedEvents: TrackedEvent[]): EventQueue => {
    const eq = <EventQueue>(illegalEventQueueInvocation());
    eq.target = illegalEventQueueInvocation();
    eq.then = thenConstructor(eq);
    eq.thenq = (...events: TrackedEvent[]) => eq.then(enqueue(...events));

    eq.enqueue = (...events: TrackedEvent[]): EventQueue => {
        const resultQueue = enqueue(...events);
        return buildEventQueue(eq.immediateEvents, eq.delayedEvents.concat(resultQueue.delayedEvents));
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
const thenConstructor = (rootTarget: TrackedEvent) =>
    (...events: TrackedEvent[]): EventQueue => {
        // Build a helper function to call `then` for a single TrackedEvent.
        const singleThen = (target: TrackedEvent, arg: TrackedEvent): EventQueue => {
            let targetImmediateEvents: TrackedEvent[];

            if (isEventQueue(target)) {
                // An EventQueue with at least one event in its delayedEvents collection cannot have its `then` method called.
                if (target.delayedEvents.length > 0) {
                    throw new RegalError("Any enqueue instruction must happen at the end of the return statement.");
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

            return buildEventQueue(targetImmediateEvents.concat(argImmediateEvents), argDelayedEvents);
        }

        // Call the helper `then` on every event, starting with the rootTarget.
        return <EventQueue>events.reduce(singleThen, rootTarget);
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
export const on = (eventName: string, eventFunc: EventFunction): TrackedEvent => {
    // Make the TrackedEvent callable like a function.
    const event = <TrackedEvent>((game: GameInstance) => {
        game.events.invoke(event);
        return noop;
    });

    event.eventName = eventName;
    event.target = eventFunc;

    event.then = thenConstructor(event);
    event.thenq = (...events: TrackedEvent[]) => event.then(enqueue(...events));

    return event;
};