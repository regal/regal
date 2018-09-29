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
 * Describes a single operation on a registered agent's property.
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
