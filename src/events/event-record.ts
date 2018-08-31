/**
 * Record of a TrackedEvent's effects in a game cycle.
 *
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
 */

import { PropertyChange, PropertyOperation } from "../agents";
import { OutputLine } from "../output";
import { noop, TrackedEvent } from "./event-model";

/** Event ID for untracked EventFunctions. */
export const DEFAULT_EVENT_ID: number = 0;
/** Name of untracked EventFunctions. */
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

/**
 * Record of a TrackedEvent's effects in a game cycle.
 */
export class EventRecord {
    /** Default EventRecord for untracked EventFunctions. */
    public static default = new EventRecord();
    /** The IDs of the OutputLines emitted by the event. */
    public output?: number[];
    /** The ID of the event that caused this event. */
    public causedBy?: number;
    /** The IDs of the events that were caused by this event. */
    public caused?: number[];
    /** The records of all changes to registered agents that were caused by this event. */
    public changes?: PropertyChange[];

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
    public trackOutputWrite(line: OutputLine): void {
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
    public trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id));
        events.forEach(e => (e.causedBy = this.id));
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
    public trackChange<T>(
        agentId: number,
        property: PropertyKey,
        op: PropertyOperation,
        init?: T,
        final?: T
    ): void {
        if (this.changes === undefined) {
            this.changes = [];
        }
        this.changes.push({
            agentId,
            final,
            init,
            op,
            property: property.toString()
        });
    }
}
