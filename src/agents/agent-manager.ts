/**
 * Contains the manager for all data relating to a single active agent.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import { PropertyChange, PropertyOperation } from "./agent-properties";
import { StaticAgentRegistry } from "./static-agent-registry";

/**
 * Manager for all data relating to a single active agent.
 *
 * For each property of the agent that is being managed, the `AgentManager`
 * will have a property of the same name which contains an array of
 * `PropertyChange`s, describing the history of that property.
 */
export interface AgentManager {
    /** The managed agent's id. */
    id: number;

    /** The `GameInstance` in which the agent is active. */
    game: GameInstance;

    /**
     * Whether there exists a history of changes for the given property.
     * @param property The name of the property.
     */
    hasPropertyRecord(property: PropertyKey): boolean;

    /**
     * Gets the most recent value of the property, if it exists.
     * @param property The name of the property.
     */
    getProperty(property: PropertyKey): any;

    /**
     * Gets the array of `PropertyChange`s describing the history of
     * that property in reverse chronological order, if it exists.
     * Otherwise, returns an empty array.
     * @param property The name of the property.
     */
    getPropertyHistory(property: PropertyKey): PropertyChange[];

    /**
     * Whether the property once existed and has since been deleted.
     * @param property The name of the property.
     */
    propertyWasDeleted(property: PropertyKey): boolean;

    /**
     * Records a change to the property.
     * @param property The name of the property.
     * @param value The new value of the property.
     */
    setProperty(property: PropertyKey, value: any): void;

    /**
     * Deletes the property, if it exists.
     * @param property The name of the property.
     */
    deleteProperty(property: PropertyKey): void;
}

/** Determines whether an object is an `AgentManager`. */
export const isAgentManager = (o: any): o is AgentManager => {
    return (
        o !== undefined && (o as AgentManager).hasPropertyRecord !== undefined
    );
};

/** Builds an implementation of `AgentManager` for the given `Agent` id and `GameInstance`. */
export const buildAgentManager = (
    id: number,
    game: GameInstance
): AgentManager => new AgentManagerImpl(id, game);

/** Implementation of `AgentManager`. */
class AgentManagerImpl implements AgentManager {
    constructor(public id: number, public game: GameInstance) {}

    public hasPropertyRecord(property: PropertyKey): boolean {
        const history: PropertyChange[] = this[property];
        return history !== undefined && history.length !== undefined;
    }

    public getProperty(property: PropertyKey): any {
        const history = this.getPropertyHistory(property);
        let value: any;

        if (history.length > 0) {
            value = history[0].final;
        }

        return value;
    }

    public getPropertyHistory(property: PropertyKey): PropertyChange[] {
        return this.hasPropertyRecord(property) ? this[property] : [];
    }

    public propertyWasDeleted(property: PropertyKey): boolean {
        const history = this.getPropertyHistory(property);

        return (
            history.length > 0 && history[0].op === PropertyOperation.DELETED
        );
    }

    public setProperty(property: PropertyKey, value: any): void {
        let initValue;
        let opType: PropertyOperation;

        const history = this.getPropertyHistory(property);

        if (history.length === 0) {
            if (StaticAgentRegistry.hasAgentProperty(this.id, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    this.id,
                    property
                );
                opType = PropertyOperation.MODIFIED;
            } else {
                opType = PropertyOperation.ADDED;
            }

            if (initValue !== value) {
                this[property] = history;
            }
        } else {
            initValue = history[0].final;

            opType = this.propertyWasDeleted(property)
                ? PropertyOperation.ADDED
                : PropertyOperation.MODIFIED;
        }

        if (initValue === value) {
            return;
        }

        const event = this.game.events.current;
        event.trackChange(this.id, property, opType, initValue, value);

        history.unshift({
            eventId: event.id,
            eventName: event.name,
            final: value,
            init: initValue,
            op: opType
        });
    }

    public deleteProperty(property: PropertyKey): void {
        if (this.propertyWasDeleted(property)) {
            return;
        }

        let initValue;
        const history = this.getPropertyHistory(property);

        if (history.length === 0) {
            if (StaticAgentRegistry.hasAgentProperty(this.id, property)) {
                initValue = StaticAgentRegistry.getAgentProperty(
                    this.id,
                    property
                );
            } else {
                return;
            }

            this[property] = history;
        } else {
            initValue = history[0].final;
        }

        const event = this.game.events.current;
        event.trackChange(
            this.id,
            property,
            PropertyOperation.DELETED,
            initValue,
            undefined
        );

        history.unshift({
            eventId: event.id,
            eventName: event.name,
            final: undefined,
            init: initValue,
            op: PropertyOperation.DELETED
        });
    }
}
