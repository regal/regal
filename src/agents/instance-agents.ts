/**
 * Contains the manager for all agents in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import { EventRecord } from "../events";
import GameInstance from "../game-instance";
import { Agent, AGENT_PROXY_HANDLER, isAgent } from "./agent-model";
import { AgentRecord } from "./agent-record";
import { AgentReference, isAgentReference } from "./agent-reference";
import { StaticAgentRegistry } from "./static-agent";

/** Whether the property is a positive integer, meaning its a valid agent id. */
export const propertyIsAgentId = (property: PropertyKey) => {
    const tryNum = Math.floor(Number(property));
    return tryNum !== Infinity && String(tryNum) === property && tryNum >= 0;
};

/**
 * Manager for all agents in a `GameInstance`.
 *
 * For each agent being tracked, the `InstanceAgents` will have a
 * property of that agent's id that contains an `AgentRecord`.
 *
 * Static agents only have instance-specific differences from
 * their static state stored in the `InstanceAgents`.
 */
export class InstanceAgents {
    /**
     * Constructs an `InstanceAgents`.
     * @param game The game instance that owns this `InstanceAgents`.
     */
    constructor(public game: GameInstance) {}

    /**
     * Gets the next available agent id by counting the number
     * of reserved ids in the `StaticAgentRegistry` and the number
     * of agents already registered with this `InstanceAgents`.
     */
    public getNextAgentId(): number {
        let i = StaticAgentRegistry.agentCount + 1;
        while (this.hasOwnProperty(i)) {
            i++;
        }
        return i;
    }

    /**
     * Adds an agent to this `InstanceAgents`. If the agent is static,
     * nothing will happen.
     *
     * @param agent The agent to be added.
     * @param event The event during which the agent was added.
     */
    public addAgent(agent: Agent, event: EventRecord): void {
        if (this.hasOwnProperty(agent.id)) {
            throw new RegalError(
                `An agent with ID <${
                    agent.id
                }> has already been registered with the instance.`
            );
        }

        if (!agent.isStatic) {
            this[agent.id] = new AgentRecord();

            for (const key in agent) {
                if (agent.hasOwnProperty(key)) {
                    this.setAgentProperty(agent.id, key, agent[key], event);
                }
            }
        }
    }

    /** Whether an agent with the given id is static or tracked by this `InstanceAgents`. */
    public hasAgent(agentId: number): boolean {
        return (
            this.hasOwnProperty(agentId) ||
            StaticAgentRegistry.hasAgent(agentId)
        );
    }

    /**
     * Get the value of a registered agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @returns The value of the property, if it exists.
     */
    public getAgentProperty(agentId: number, property: PropertyKey): any {
        const agentRecord: AgentRecord = this[agentId];
        let value;

        if (agentRecord === undefined) {
            if (StaticAgentRegistry.hasAgent(agentId)) {
                value = StaticAgentRegistry.getAgentProperty(agentId, property);
            } else {
                throw new RegalError(
                    `No agent with ID <${agentId}> exists in the instance or the static registry.`
                );
            }
        } else {
            value = agentRecord.getProperty(property);

            // If the property exists only in the static agent registry and it hasn't been deleted in this instance:
            if (
                value === undefined &&
                !agentRecord.propertyWasDeleted(property) &&
                StaticAgentRegistry.hasAgentProperty(agentId, property)
            ) {
                value = StaticAgentRegistry.getAgentProperty(agentId, property);
            }
        }

        // If the value is an agent reference, return a new proxy agent.
        if (isAgentReference(value)) {
            const psuedoAgent = new Agent(value.refId, this.game);
            value = new Proxy(psuedoAgent, AGENT_PROXY_HANDLER);
        }

        return value;
    }

    /**
     * Sets the value of a registered agent's property, or adds the
     * property if it doesn't yet exist.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @param value The new value of the property.
     * @param event The event during which the change took place.
     *
     * @returns Whether the update was successful.
     */
    public setAgentProperty(
        agentId: number,
        property: PropertyKey,
        value: any,
        event: EventRecord
    ): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (StaticAgentRegistry.hasAgent(agentId)) {
                this[agentId] = new AgentRecord();
            } else {
                throw new RegalError(
                    `No agent with ID <${agentId}> exists in the instance or the static registry.`
                );
            }
        }

        const agentRecord: AgentRecord = this[agentId];

        if (isAgent(value)) {
            if (!value.isRegistered) {
                const game: GameInstance = this.getAgentProperty(
                    agentId,
                    "game"
                );
                value = value.register(game);
            }

            value = new AgentReference(value.id);
        }

        agentRecord.setProperty(event, agentId, property, value);

        return true;
    }

    /**
     * Whether this `InstanceAgents` has the agent property or if there's
     * a static agent that has the property, and the property hasn't
     * been deleted.
     *
     * @param agentId The agent id.
     * @param property The name of the property.
     */
    public hasAgentProperty(agentId: number, property: PropertyKey): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (StaticAgentRegistry.hasAgent(agentId)) {
                return StaticAgentRegistry.hasAgentProperty(agentId, property);
            }
            throw new RegalError(
                `No agent with ID <${agentId}> exists in the instance or the static registry.`
            );
        }

        const agentRecord: AgentRecord = this[agentId];

        return (
            agentRecord.hasOwnProperty(property) &&
            !agentRecord.propertyWasDeleted(property)
        );
    }

    /**
     * Deletes the registered agent's property.
     *
     * @param agentId The agent's id.
     * @param property The name of the property.
     * @param event The event during which the deletion took place.
     *
     * @returns Whether the property was deleted.
     */
    public deleteAgentProperty(
        agentId: number,
        property: PropertyKey,
        event: EventRecord
    ): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (StaticAgentRegistry.hasAgent(agentId)) {
                if (StaticAgentRegistry.hasAgentProperty(agentId, property)) {
                    this[agentId] = new AgentRecord();
                } else {
                    // If the static agent doesn't exist in the instance state, but that agent doesn't
                    // have the property that someone is attempting to delete, we don't do anything.
                    return false;
                }
            } else {
                throw new RegalError(
                    `No agent with ID <${agentId}> exists in the instance or the static registry.`
                );
            }
        }

        const agentRecord: AgentRecord = this[agentId];

        return agentRecord.deleteProperty(event, agentId, property);
    }

    /**
     * Whether this `InstanceAgents` once had the agent property and it was deleted.
     * @param agentId The agent's id.
     * @param property The name of the property.
     */
    public agentPropertyWasDeleted(
        agentId: number,
        property: PropertyKey
    ): boolean {
        return (
            this.hasOwnProperty(agentId) &&
            (this[agentId] as AgentRecord).propertyWasDeleted(property)
        );
    }

    /**
     * Creates a new `InstanceAgents` for the new game cycle.
     * **Don't call this unless you know what you're doing.**
     * @param current The `GameInstance` for the new game cycle.
     */
    public cycle(current: GameInstance): InstanceAgents {
        const newAgents = new InstanceAgents(current);

        const agentKeys = Object.keys(this).filter(propertyIsAgentId);
        const agentRecords = agentKeys.map(key => this[key] as AgentRecord);

        for (let i = 0; i < agentRecords.length; i++) {
            const formerAgent = agentRecords[i];
            const keysToAdd = Object.keys(formerAgent).filter(
                key => key !== "game" && key !== "_id"
            );

            // Create new Agent with the old agent's id and the new GameInstance.
            const id = Number.parseInt(agentKeys[i], 10);
            const newAgent = new Agent(id, current);
            newAgents.addAgent(newAgent, EventRecord.default); // Note: If the agent is static, this won't do anything.

            // For each updated property on the old agent, add its last value to the new agent.
            keysToAdd.forEach(key => {
                if (formerAgent.propertyWasDeleted(key)) {
                    if (StaticAgentRegistry.hasAgentProperty(id, key)) {
                        newAgents.deleteAgentProperty(
                            id,
                            key,
                            EventRecord.default
                        ); // Record deletions to static agents.
                    }

                    return; // If the property was deleted, don't add it to the new record.
                }

                let formerPropertyValue = formerAgent.getProperty(key);

                if (isAgentReference(formerPropertyValue)) {
                    formerPropertyValue = new AgentReference(
                        formerPropertyValue.refId
                    );
                }

                newAgents.setAgentProperty(
                    newAgent.id,
                    key,
                    formerPropertyValue,
                    EventRecord.default
                );
            });
        }

        return newAgents;
    }
}
