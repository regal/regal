/**
 * Contains the object representation of a tracked event's effects in a game cycle.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PropertyChange, PropertyOperation } from "../agents";
import { OutputLine } from "../output";
import { noop, TrackedEvent } from "./event-model";

/** Event ID for untracked `EventFunction`s. */
export const DEFAULT_EVENT_ID: number = 0;
/** Name of untracked `EventFunction`s. */
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

/**
 * Record of a `TrackedEvent`'s effects in a game cycle.
 */
export class EventRecord {
    /** The IDs of the `OutputLine`s emitted by the event. */
    public output?: number[];
    /** The ID of the event that caused this event. */
    public causedBy?: number;
    /** The IDs of the events that were caused by this event. */
    public caused?: number[];
    /** The records of all changes to registered agents that were caused by this event. */
    public changes?: PropertyChange[];

    /** Default `EventRecord` for untracked `EventFunction`s. */
    public static get default() {
        return new EventRecord();
    }

    /**
     * Constructs a new `EventRecord`.
     *
     * @param id The event's unique numeric ID (optional).
     * @param name The event's name (optional).
     * @param func The event's `TrackedEvent`. Defaults to `noop`.
     */
    constructor(
        public id: number = DEFAULT_EVENT_ID,
        public name: string = DEFAULT_EVENT_NAME,
        public func: TrackedEvent = noop
    ) {}

    /**
     * Appends a reference to an `OutputLine` to the `EventRecord`'s output log.
     * @param line The line of output emitted by the event.
     */
    public trackOutputWrite(line: OutputLine): void {
        if (this.output === undefined) {
            this.output = [];
        }
        this.output.push(line.id);
    }

    /**
     * Creates an association between this `EventRecord` and the caused events,
     * setting the caused events' `causedBy` properties to this `EventRecord`'s ID, and
     * appending the events' IDs to this `EventRecord`'s `caused` property.
     *
     * @param events The events that were caused by this event.
     */
    public trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id));
        events.forEach(e => (e.causedBy = this.id));
    }

    /**
     * Adds a record of a single change to a registered agent's property to the
     * `EventRecord`'s `changes` property.
     */
    public trackChange(propChange: PropertyChange): void {
        if (this.changes === undefined) {
            this.changes = [];
        }

        this.changes.push(propChange);
    }
}
