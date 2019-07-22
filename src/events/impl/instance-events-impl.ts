/*
 * Contains the current implementation of `InstanceEvents`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider, PKProvider } from "../../common";
import { GameInstanceInternal } from "../../state";
import { EventRecord } from "../event-record";
import {
    isEventQueue,
    isTrackedEvent,
    noop,
    TrackedEvent
} from "../event-types";
import { InstanceEventsInternal } from "../instance-events-internal";
import { EVENT_RESERVED_KEYS } from "./event-keys";
import { buildEventRecord } from "./event-record-impl";

/**
 * Builds an `InstanceEventsInternal`.
 * @param game The game instance that owns this `InstanceEventsInternal`.
 * @param pkProvider The existing event PK provider (optional).
 */
export const buildInstanceEvents = (
    game: GameInstanceInternal,
    pkProvider?: PKProvider<EventRecord>
): InstanceEventsInternal => new InstanceEventsImpl(game, pkProvider);

class InstanceEventsImpl implements InstanceEventsInternal {
    public history: EventRecord[] = [];

    /** Internal queue of events that have yet to be executed. */
    private _queue: EventRecord[] = [];

    /** The internal `EventRecord` `PKProvider`. */
    private _pkProvider: PKProvider<EventRecord>;

    constructor(
        public game: GameInstanceInternal,
        pkProvider: PKProvider<EventRecord>
    ) {
        this._pkProvider = pkProvider
            ? pkProvider
            : buildPKProvider(EVENT_RESERVED_KEYS);
    }

    get current(): EventRecord {
        let event = this._queue[0];

        if (event === undefined) {
            event = buildEventRecord();
        }

        return event;
    }

    public invoke(event: TrackedEvent): void {
        this._addEvent(event);
        this._executeCurrent();
    }

    public recycle(newInstance: GameInstanceInternal): InstanceEventsInternal {
        return new InstanceEventsImpl(newInstance, this._pkProvider);
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
            buildEventRecord(this._pkProvider.next(), evObj.eventName, evObj);

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
