/*
 * Contains the manager for all data relating to a single active agent.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../common";
import { GameInstance } from "../state";
import { Agent } from "./agent";
import { PropertyChange } from "./agent-properties";

/**
 * Manager for all data relating to a single active agent.
 *
 * For each property of the agent that is being managed, the `AgentManager`
 * will have a property of the same name which contains an array of
 * `PropertyChange`s, describing the history of that property.
 */
export interface AgentManager {
    /** The managed agent's id. */
    id: PK<Agent>;

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
