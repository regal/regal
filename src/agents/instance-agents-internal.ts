/*
 * Contains the manager for all agents in a `GameInstance`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstanceInternal } from "../state";
import { Agent } from "./agent";
import { AgentManager } from "./agent-manager";
import { AgentId, AgentProtoId } from "./agent-meta";
import { PrototypeRegistry } from "./prototype-registry";

/**
 * Manager for all agents in a `GameInstance`.
 *
 * For each active agent, the `InstanceAgentsInternal` will have a property
 * at that agent's id that contains an `AgentManager`.
 */
export interface InstanceAgentsInternal {
    /** The `GameInstance` that owns this `InstanceAgentsInternal`. */
    readonly game: GameInstanceInternal;

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
    getAgentManager(id: AgentId): AgentManager;

    /**
     * Creates an `AgentManager` for the given id and assigns it as a
     * property to this `GameInstance` with the key as the id.
     *
     * @param id The agent's id.
     * @returns The created `AgentManager`.
     */
    createAgentManager(id: AgentId): AgentManager;

    /**
     * Reserves an id with the `InstanceAgentsInternal` for a newly activated agent.
     * @returns The reserved agent id.
     */
    reserveNewId(): AgentId;

    /**
     * Get the value of an active agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @returns The value of the property, if it exists.
     */
    getAgentProperty(id: AgentId, property: PropertyKey): any;

    /**
     * Lists the names of each of the agent's properties.
     *
     * @param id The agent's id.
     * @returns A list of property keys.
     */
    getAgentPropertyKeys(id: AgentId): string[];

    /**
     * Sets the value of an active agent's property, or adds the
     * property if it doesn't yet exist.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @param value The new value of the property.
     * @returns Whether the update was successful.
     */
    setAgentProperty(id: AgentId, property: PropertyKey, value: any): boolean;

    /**
     * Whether this `InstanceAgentsInternal` has the agent property or if there's
     * a static agent that has the property, and the property hasn't
     * been deleted.
     *
     * @param agentId The agent id.
     * @param property The name of the property.
     */
    hasAgentProperty(id: AgentId, property: PropertyKey): boolean;

    /**
     * Deletes the active agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @returns Whether the property was deleted.
     */
    deleteAgentProperty(id: AgentId, property: PropertyKey): boolean;

    /**
     * Creates an `InstanceAgentsInternal` for the new game cycle, keeping only
     * the final properties of every agent from before.
     *
     * @param newInstance The new `GameInstance` that will own the new `InstanceAgentsInternal`.
     */
    recycle(newInstance: GameInstanceInternal): InstanceAgentsInternal;

    /**
     * Traverses all agents that are accessible from the `GameInstance`'s
     * state via breadth-first search. All remaining agents (the ones with
     * no references to them) are deleted from the `InstanceAgentsInternal`.
     *
     * If run at the improper time, this will break event sourcing and/or
     * instance reverting. Make sure to use this correctly.
     */
    scrubAgents(): void;

    /**
     * Ensures an agent's prototype is tracked in either the instance
     * `PrototypeRegistry` or the `StaticPrototypeRegistry`.
     *
     * If `agent.meta.protoId` is already defined, nothing will happen.
     * If the agent's prototype exists in the static registry, the agent's
     * `protoId` will be assigned.
     * Otherwise, the agent's prototype will be added to the instance registry
     * and the agent's `protoId` will be assigned.
     * @param agent The agent to be registered.
     */
    registerAgentPrototype(agent: Agent): AgentProtoId;

    /**
     * Creates an agent with a prototype that corresponds to the given `protoId`
     * from either the instance registry or the `StaticPrototypeRegistry`.
     * @param protoId The prototype's id.
     */
    createAgentWithPrototype(protoId: AgentProtoId): object;

    /**
     * Gets the instance's internal agent prototype registry.
     * Right now, this is used for testing convenience only.
     */
    getPrototypeRegistry(): PrototypeRegistry;
}
