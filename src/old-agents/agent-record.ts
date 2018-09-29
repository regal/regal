/**
 * Contains models for tracking changes made to registered agents.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { EventRecord } from "../events";
import { StaticAgentRegistry } from "./static-agent";

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

/**
 * Container for all changes made to a registered agent during the current game cycle.
 *
 * For each property of the agent being tracked, the `AgentRecord` will have a
 * property of the same name that has an array of `PropertyChange`s that occurred
 * during the current game cycle.
 *
 * When one of these properties is accessed, the `AgentRecord` will return the most recent value.
 */
export class AgentRecord {
    /**
     * Get the most recent value of the agent's property.
     * @param propertyKey The name of the property to be retrieved.
     * @returns The most recent value of the property, if it exists.
     */
    public getProperty(propertyKey: PropertyKey): any {
        const changes: PropertyChange[] = this[propertyKey];
        let property: any;

        if (changes !== undefined && changes.length > 0) {
            property = changes[0].final;
        }

        return property;
    }

    /**
     * Records a change to the registered agent's property.
     *
     * @param event The event that caused the change.
     * @param agentId The id of the agent being updated.
     * @param property The name of the property being updated.
     * @param value The new value of the property.
     */
    public setProperty<T>(
        event: EventRecord,
        agentId: number,
        property: PropertyKey,
        value: T
    ): void {
        let initValue = this.getProperty(property);

        if (
            initValue === undefined &&
            StaticAgentRegistry.hasAgentProperty(agentId, property)
        ) {
            initValue = StaticAgentRegistry.getAgentProperty(agentId, property);
        }

        const op =
            initValue === undefined
                ? PropertyOperation.ADDED
                : PropertyOperation.MODIFIED;

        this._addRecord(event, property, op, initValue, value);
        event.trackChange(agentId, property, op, initValue, value);
    }

    /**
     * Deletes a property of the registered agent.
     *
     * @param event The event that caused the change.
     * @param agentId The id of the agent being updated.
     * @param property The name of the property being updated.
     *
     * @returns Whether the property was deleted.
     */
    public deleteProperty(
        event: EventRecord,
        agentId: number,
        property: PropertyKey
    ): boolean {
        let initValue = this.getProperty(property);

        if (!this.hasOwnProperty(property)) {
            if (StaticAgentRegistry.hasAgentProperty(agentId, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    agentId,
                    property
                );
            } else {
                return false;
            }
        }

        this._addRecord(event, property, PropertyOperation.DELETED, initValue);
        event.trackChange(
            agentId,
            property,
            PropertyOperation.DELETED,
            initValue
        );

        return true;
    }

    /**
     * Whether the registered agent used to have the property and it was deleted.
     * @param propertyKey The name of the property in question.
     */
    public propertyWasDeleted(propertyKey: PropertyKey): boolean {
        if (this.hasOwnProperty(propertyKey)) {
            const lastChange: PropertyChange = this[propertyKey][0];

            if (lastChange.op === PropertyOperation.DELETED) {
                return true;
            }
        }

        return false;
    }

    /** Internal helper method to add a `PropertyChange` record to the `AgentRecord`. */
    private _addRecord<T>(
        event: EventRecord,
        property: PropertyKey,
        op: PropertyOperation,
        init?: T,
        final?: T
    ): void {
        if (!(property in this)) {
            this[property] = new Array<PropertyChange>();
        }

        const change: PropertyChange = {
            eventId: event.id,
            eventName: event.name,
            final,
            init,
            op
        };

        (this[property] as PropertyChange[]).unshift(change);
    }
}
