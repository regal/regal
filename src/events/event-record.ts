/*
 * Contains the interface for a tracked event's effects in a game cycle.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PropertyChange } from "../agents";
import { OutputLine } from "../output";
import { RandomRecord } from "../random";
import { TrackedEvent } from "./event-types";

/** Event ID for untracked `EventFunction`s. */
export const DEFAULT_EVENT_ID: number = 0;
/** Name of untracked `EventFunction`s. */
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

/**
 * Record of a `TrackedEvent`'s effects in a game cycle.
 */
export interface EventRecord {
    /* The event's unique numeric ID. */
    id: number;

    /* The event's name. */
    name: string;

    /* The event's `TrackedEvent`. */
    func: TrackedEvent;

    /** The IDs of the `OutputLine`s emitted by the event. */
    output?: number[];

    /** The ID of the event that caused this event. */
    causedBy?: number;

    /** The IDs of the events that were caused by this event. */
    caused?: number[];

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
