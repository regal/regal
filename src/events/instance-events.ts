/**
 * Contains the manager for all events in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import {
    isEventQueue,
    isTrackedEvent,
    noop,
    TrackedEvent
} from "./event-model";
import { DEFAULT_EVENT_ID, EventRecord } from "./event-record";

/**
 * Manager for all events in a `GameInstance`.
 */
export default class InstanceEvents {
    /** The current `EventRecord`. */
    get current(): EventRecord {
        let event = this._queue[0];

        if (event === undefined) {
            event = EventRecord.default;
        }

        return event;
    }

    /** The ID of the most recently generated `EventRecord`. */
    get lastEventId() {
        return this._lastEventId;
    }

    /** Contains records of the past events executed during the game cycle. */
    public history: EventRecord[] = [];

    /** Internal member for the ID of the most recently generated `EventRecord`. */
    private _lastEventId;

    /** Internal queue of events that have yet to be executed. */
    private _queue: EventRecord[] = [];

    /**
     * Constructs an `InstanceEvents`.
     * @param game The game instance that owns this `InstanceEvents`.
     * @param startingEventId Optional starting ID for new `EventRecord`s.
     */
    constructor(public game: GameInstance, startingEventId = DEFAULT_EVENT_ID) {
        this._lastEventId = startingEventId;
    }

    /**
     * Executes the given event and all events caused by it.
     * @param event The `TrackedEvent` to be invoked.
     */
    public invoke(event: TrackedEvent): void {
        this._addEvent(event);
        this._executeCurrent();
    }

    /**
     * Creates a new `InstanceEvents` for the new game cycle.
     * **Don't call this unless you know what you're doing.**
     * @param current The `GameInstance` for the new game cycle.
     */
    public cycle(current: GameInstance): InstanceEvents {
        return new InstanceEvents(current, this.lastEventId);
    }

    /**
     * Adds the event to the internal queue. If the event is an `EventQueue`,
     * the event's `immediateEvents` are added to the front of the queue
     * and the `delayedEvents` are added to the back of the queue.
     *
     * @param event The `TrackedEvent` to be added to the queue.
     * @param cause The `EventRecord` to be recorded as the event's cause (optional).
     */
    private _addEvent(event: TrackedEvent, cause?: EventRecord): void {
        let immediateEvents: TrackedEvent[];
        let delayedEvents: TrackedEvent[];

        if (isEventQueue(event)) {
            immediateEvents = event.immediateEvents;
            delayedEvents = event.delayedEvents;
        } else {
            immediateEvents = [event];
            delayedEvents = [];
        }

        const mapToRecord = (evObj: TrackedEvent) =>
            new EventRecord(++this._lastEventId, evObj.eventName, evObj);

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
     * Deletes unnecessary data from the current `EventRecord`
     * and moves it to the history array.
     */
    private _archiveCurrent(): void {
        delete this.current.func;
        this.history.unshift(this._queue.shift());
    }

    /**
     * Executes the current `EventRecord` and recursively exeuctes
     * all remaining `EventRecords` in the queue.
     */
    private _executeCurrent(): void {
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
}
