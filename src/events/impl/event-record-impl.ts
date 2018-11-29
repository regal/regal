/*
 * Contains the current implementation for `EventRecord`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PropertyChange } from "../../agents";
import { OutputLine } from "../../output";
import { RandomRecord } from "../../random";
import {
    DEFAULT_EVENT_ID,
    DEFAULT_EVENT_NAME,
    EventRecord
} from "../event-record";
import { noop, TrackedEvent } from "../event-types";

/**
 * Builds a new `EventRecord`.
 *
 * @param id The event's unique numeric ID (optional).
 * @param name The event's name (optional).
 * @param func The event's `TrackedEvent`. Defaults to `noop`.
 */
export const buildEventRecord = (
    id: number = DEFAULT_EVENT_ID,
    name: string = DEFAULT_EVENT_NAME,
    func: TrackedEvent = noop
): EventRecord => new EventRecordImpl(id, name, func);

class EventRecordImpl implements EventRecord {
    public output?: number[];
    public causedBy?: number;
    public caused?: number[];
    public changes?: PropertyChange[];
    public randoms?: RandomRecord[];

    constructor(
        public id: number,
        public name: string,
        public func: TrackedEvent
    ) {}

    public trackOutputWrite(line: OutputLine): void {
        if (this.output === undefined) {
            this.output = [];
        }
        this.output.push(line.id);
    }

    public trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id));
        events.forEach(e => (e.causedBy = this.id));
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
