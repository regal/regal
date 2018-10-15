/**
 * Contains the manager for all agents in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    AgentManager,
    buildAgentManager,
    isAgentManager
} from "./agent-manager";
import { activeAgentProxy, Agent, isAgent } from "./agent-model";
import { AgentReference, isAgentReference } from "./agent-reference";
import { StaticAgentRegistry } from "./static-agent-registry";

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

/** Builds an implementation of `InstanceAgents` for the given `GameInstance`. */
export const buildInstanceAgents = (game: GameInstance): InstanceAgents =>
    new InstanceAgentsImpl(game);

/**
 * Creates an `InstanceAgents` for the new game cycle, keeping only
 * the final properties of every agent from before.
 *
 * @param oldAgents     The `InstanceAgents` to recycle data from.
 * @param newInstance   The new `GameInstance` that will own this `InstanceAgents`.
 */
export const recycleInstanceAgents = (
    oldAgents: InstanceAgents,
    newInstance: GameInstance
): InstanceAgents => {
    const newAgents = new InstanceAgentsImpl(newInstance);

    for (const formerAgent of oldAgents.agentManagers()) {
        const id = formerAgent.id;
        const am = newAgents.createAgentManager(id);

        const propsToAdd = Object.keys(formerAgent).filter(
            key => key !== "game" && key !== "id"
        );

        // For each updated property on the old agent, add its last value to the new agent.
        propsToAdd.forEach(prop => {
            if (formerAgent.propertyWasDeleted(prop)) {
                if (StaticAgentRegistry.hasAgentProperty(id, prop)) {
                    am.deleteProperty(prop); // Record deletions to static agents.
                }

                return; // If the property was deleted, don't add it to the new record.
            }

            let formerValue = formerAgent.getProperty(prop);

            if (isAgentReference(formerValue)) {
                formerValue = new AgentReference(formerValue.refId);
            }

            am.setProperty(prop, formerValue);
        });
    }

    return newAgents;
};

/** Whether the property is a positive integer, meaning its a valid agent id. */
export const propertyIsAgentId = (property: PropertyKey) => {
    const tryNum = Math.floor(Number(property));
    return tryNum !== Infinity && String(tryNum) === property && tryNum >= 0;
};

/** Implementation of `InstanceAgents`. */
class InstanceAgentsImpl implements InstanceAgents {
    constructor(public game: GameInstance) {
        this.createAgentManager(0);
    }

    public agentManagers(): AgentManager[] {
        return Object.keys(this)
            .filter(propertyIsAgentId)
            .map(key => this[key] as AgentManager);
    }

    public reserveNewId(): number {
        const agentKeys = Object.keys(this).filter(propertyIsAgentId);
        let id = StaticAgentRegistry.getNextAvailableId();

        while (agentKeys.includes(id.toString())) {
            id++;
        }

        this.createAgentManager(id);

        return id;
    }

    public createAgentManager(id: number): AgentManager {
        const am = buildAgentManager(id, this.game);
        this[id] = am;
        return am;
    }

    public getAgentProperty(id: number, property: PropertyKey) {
        const am = this.getAgentManager(id);
        let value: any;

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            value = StaticAgentRegistry.getAgentProperty(id, property);
        } else {
            if (property === "id") {
                value = id;
            } else if (am.hasPropertyRecord(property)) {
                value = am.getProperty(property);
            } else if (StaticAgentRegistry.hasAgent(id)) {
                value = StaticAgentRegistry.getAgentProperty(id, property);
            }
        }

        if (isAgent(value)) {
            value = activeAgentProxy(value.id, this.game);
        } else if (isAgentReference(value)) {
            value = activeAgentProxy(value.refId, this.game);
        }

        return value;
    }

    public setAgentProperty(
        id: number,
        property: PropertyKey,
        value: any
    ): boolean {
        if (property === "id" || property === "game") {
            throw new RegalError(
                `The agent's <${property}> property cannot be set.`
            );
        }

        let am = this.getAgentManager(id);

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            am = this.createAgentManager(id);
        }

        if (isAgent(value)) {
            if (value.id < 0) {
                const newId = this.reserveNewId();
                value.id = newId;
                value = this.game.using(value);
            }
            value = new AgentReference(value.id);
        } else if (value instanceof Array) {
            (value as any).id = this.reserveNewId(); // todo - start here; probably set prototype to Array in the getter
            value = this.game.using(value);
            value = new AgentReference(value.id);
        }

        am.setProperty(property, value);

        return true;
    }

    public hasAgentProperty(id: number, property: PropertyKey): boolean {
        const am = this.getAgentManager(id);

        const staticPropExists = StaticAgentRegistry.hasAgentProperty(
            id,
            property
        );

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            return staticPropExists;
        }

        if (property === "id") {
            return true;
        }

        const propExists = am.hasPropertyRecord(property) || staticPropExists;

        return propExists && !am.propertyWasDeleted(property);
    }

    public deleteAgentProperty(id: number, property: PropertyKey): boolean {
        if (property === "id" || property === "game") {
            throw new RegalError(
                `The agent's <${property}> property cannot be deleted.`
            );
        }

        let am = this.getAgentManager(id);

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            am = this.createAgentManager(id);
        }

        am.deleteProperty(property);

        return true;
    }

    public getAgentManager(id: number): AgentManager {
        const result = this[id];

        if (isAgentManager(result)) {
            return result;
        }

        return undefined;
    }
}
