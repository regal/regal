/*
 * Contains the current implementation for `EventRecord`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PropertyChange } from "../../agents";
import { FK, PK } from "../../common";
import { OutputLine } from "../../output";
import { RandomRecord } from "../../random";
import { EventRecord } from "../event-record";
import { noop, TrackedEvent } from "../event-types";
import { getUntrackedEventPK } from "./event-keys";

/** Name of untracked `EventFunction`s. */
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

/**
 * Builds a new `EventRecord`.
 *
 * @param id The event's unique ID (optional).
 * @param name The event's name (optional).
 * @param func The event's `TrackedEvent`. Defaults to `noop`.
 */
export const buildEventRecord = (
    id: PK<EventRecord> = undefined,
    name: string = DEFAULT_EVENT_NAME,
    func: TrackedEvent = noop
): EventRecord => {
    if (id === undefined) {
        id = getUntrackedEventPK();
    }

    return new EventRecordImpl(id, name, func);
};

class EventRecordImpl implements EventRecord {
    public output?: Array<FK<PK<OutputLine>>>;
    public causedBy?: FK<PK<EventRecord>>;
    public caused?: Array<FK<PK<EventRecord>>>;
    public changes?: PropertyChange[];
    public randoms?: RandomRecord[];

    constructor(
        public id: PK<EventRecord>,
        public name: string,
        public func: TrackedEvent
    ) {}

    public trackOutputWrite(line: OutputLine): void {
        if (this.output === undefined) {
            this.output = [];
        }
        this.output.push(line.id.ref());
    }

    public trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id.ref()));
        events.forEach(e => (e.causedBy = this.id.ref()));
    }

    public trackChange(propChange: PropertyChange): void {
        if (this.changes === undefined) {
            this.changes = [];
        }

        this.changes.push(propChange);
    }

    public trackRandom(randRecord: RandomRecord): void {
        if (this.randoms === undefined) {
            this.randoms = [];
        }
        this.randoms.push(randRecord);
    }
}
