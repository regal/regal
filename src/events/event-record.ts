/*
 * Contains the interface for a tracked event's effects in a game cycle.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PropertyChange } from "../agents";
import { PK } from "../common";
import { OutputLine, OutputLineId } from "../output";
import { RandomRecord } from "../random";
import { TrackedEvent } from "./event-types";

/** An event primary key. */
export type EventId = PK<EventRecord>;

/**
 * Record of a `TrackedEvent`'s effects in a game cycle.
 */
export interface EventRecord {
    /* The event's unique ID. */
    id: EventId;

    /* The event's name. */
    name: string;

    /* The event's `TrackedEvent`. */
    func: TrackedEvent;

    /** The IDs of the `OutputLine`s emitted by the event. */
    output?: OutputLineId[];

    /** The ID of the event that caused this event. */
    causedBy?: EventId;

    /** The IDs of the events that were caused by this event. */
    caused?: EventId[];

    /** The records of all changes to registered agents that were caused by this event. */
    changes?: PropertyChange[];

    /** The records of all random values generated during the event. */
    randoms?: RandomRecord[];

    /**
     * Appends a reference to an `OutputLine` to the `EventRecord`'s output log.
     * @param line The line of output emitted by the event.
     */
    trackOutputWrite(line: OutputLine): void;

    /**
     * Creates an association between this `EventRecord` and the caused events,
     * setting the caused events' `causedBy` properties to this `EventRecord`'s ID, and
     * appending the events' IDs to this `EventRecord`'s `caused` property.
     *
     * @param events The events that were caused by this event.
     */
    trackCausedEvent(...events: EventRecord[]): void;

    /**
     * Adds a record of a single change to a registered agent's property to the
     * `EventRecord`'s `changes` property.
     * @param propChange The `PropertyChange`.
     */
    trackChange(propChange: PropertyChange): void;

    /**
     * Adds a record of a randomly generated value to the `EventRecord`'s `randoms` property.
     * @param randRecord The `RandomRecord`.
     */
    trackRandom(randRecord: RandomRecord): void;
}
