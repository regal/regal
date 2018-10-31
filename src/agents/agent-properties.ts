/**
 * Contains models for tracking modifications made to active agents.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

/** Type of modification done to an agent's property. */
export enum PropertyOperation {
    /** The property was added to the agent. */
    ADDED = "ADDED",

    /** The property's value was changed. */
    MODIFIED = "MODIFIED",

    /** The property was deleted. */
    DELETED = "DELETED"
}

/**
 * Describes a single operation on an active agent's property.
 */
export interface PropertyChange {
    /** The numeric id of the `TrackedEvent` during which the change took place (optional). */
    eventId?: number;

    /** The name of the `TrackedEvent` during which the change took place (optional). */
    eventName?: string;

    /** The numeric id of the registered `Agent` (optional). */
    agentId?: number;

    /** The operation performed on the agent's property. */
    op: PropertyOperation;

    /** The property's value before the operation (optional). */
    init?: any;

    /** The property's value after the operation (optional). */
    final?: any;

    /** The property's name (optional). */
    property?: string;
}

/** Convert the given `PropertyChange` into the appropriate view for an `AgentManager`. */
export const pcForAgentManager = (pc: PropertyChange): PropertyChange => ({
    eventId: pc.eventId,
    eventName: pc.eventName,
    final: pc.final,
    init: pc.init,
    op: pc.op
});

/** Convert the given PropertyChange into the appropriate view for an `EventRecord`. */
export const pcForEventRecord = (pc: PropertyChange): PropertyChange => ({
    agentId: pc.agentId,
    final: pc.final,
    init: pc.init,
    op: pc.op,
    property: pc.property
});
