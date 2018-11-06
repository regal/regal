/**
 * Contains the manager for all agents in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import { AgentManager } from "./agent-manager";

/**
 * Manager for all agents in a `GameInstance`.
 *
 * For each active agent, the `InstanceAgents` will have a property
 * at that agent's id that contains an `AgentManager`.
 */
export interface InstanceAgents {
    /** The `GameInstance` that owns this `InstanceAgents`. */
    game: GameInstance;

    /**
     * Gets the `AgentManager` assigned to every agent that is active
     * within this `GameInstance`.
     *
     * Static agents will only have a manager if they have been modified.
     */
    agentManagers(): AgentManager[];

    /**
     * Gets the `AgentManager` for the active agent with the given id.
     * @param id The agent's manager, or undefined if it doesn't exist.
     */
    getAgentManager(id: number): AgentManager;

    /**
     * Creates an `AgentManager` for the given id and assigns it as a
     * property to this `GameInstance` with the key as the id.
     *
     * @param id The agent's id.
     * @returns The created `AgentManager`.
     */
    createAgentManager(id: number): AgentManager;

    /**
     * Reserves an id with the `InstanceAgents` for a newly activated agent.
     * @returns The reserved agent id.
     */
    reserveNewId(): number;

    /**
     * Get the value of an active agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @returns The value of the property, if it exists.
     */
    getAgentProperty(id: number, property: PropertyKey): any;

    /**
     * Lists the names of each of the agent's properties.
     *
     * @param id The agent's id.
     * @returns A list of property keys.
     */
    getAgentPropertyKeys(id: number): string[];

    /**
     * Sets the value of an active agent's property, or adds the
     * property if it doesn't yet exist.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @param value The new value of the property.
     * @returns Whether the update was successful.
     */
    setAgentProperty(id: number, property: PropertyKey, value: any): boolean;

    /**
     * Whether this `InstanceAgents` has the agent property or if there's
     * a static agent that has the property, and the property hasn't
     * been deleted.
     *
     * @param agentId The agent id.
     * @param property The name of the property.
     */
    hasAgentProperty(id: number, property: PropertyKey): boolean;

    /**
     * Deletes the active agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @returns Whether the property was deleted.
     */
    deleteAgentProperty(id: number, property: PropertyKey): boolean;
}

/** Whether the property is a positive integer, meaning its a valid agent id. */
export const propertyIsAgentId = (property: PropertyKey) => {
    const tryNum = Math.floor(Number(property));
    return tryNum !== Infinity && String(tryNum) === property && tryNum >= 0;
};
