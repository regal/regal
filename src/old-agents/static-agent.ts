/**
 * Contains the custom proxy for static agents and the static class
 * that holds the references to every static agent in the Regal game.
 *
 * A static agent is an agent defined in the static context of a Regal
 * game. The initial values of a static agent's properties are stored in
 * the `StaticAgentRegistry` so that the data is not duplicated unnecessarily
 * across many game instances. The properties of static agents can be modified
 * just like regular agents, but only the changes are stored in `InstanceAgents`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import { Agent } from "./agent-model";
import { propertyIsAgentId } from "./instance-agents";

/**
 * Proxy handler that controls access to static `Agent` objects.
 */
const STATIC_AGENT_PROXY_HANDLER = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = Reflect.get(target, propertyKey);

        if (
            value === undefined &&
            (target.game === undefined ||
                !target.game.agents.agentPropertyWasDeleted(
                    target.id,
                    propertyKey
                ))
        ) {
            value = StaticAgentRegistry.getAgentProperty(
                target.id,
                propertyKey
            );
        }

        return value;
    },

    has(target: Agent, propertyKey: PropertyKey) {
        if (
            target.game !== undefined &&
            target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)
        ) {
            return false;
        }
        return StaticAgentRegistry.hasAgentProperty(target.id, propertyKey);
    }
};

/**
 * Static class that manages all static agents used in the game.
 */
export class StaticAgentRegistry {
    /** The number of static agents. */
    public static agentCount = 0;

    /**
     * Adds a nonstatic agent to the static agent registry and returns
     * a static agent proxy in its place.
     *
     * @param agent The agent to be added.
     * @returns The static agent proxy.
     */
    public static addAgent<T extends Agent>(agent: T): T {
        if (agent.isRegistered) {
            throw new RegalError(
                "Cannot create a static version of a registered agent."
            );
        }
        if (agent.isStatic) {
            throw new RegalError(
                "Cannot create more than one static version of an agent."
            );
        }

        const id = ++this.agentCount;
        agent.id = id;
        this[id] = agent;

        return new Proxy(new Agent(agent.id), STATIC_AGENT_PROXY_HANDLER) as T;
    }

    /**
     * Gets a property of a static agent.
     *
     * @param agentId The agent's id.
     * @param propertyKey The name of the property.
     * @returns The value of the property.
     */
    public static getAgentProperty(
        agentId: number,
        propertyKey: PropertyKey
    ): any {
        if (!this.hasOwnProperty(agentId)) {
            throw new RegalError(
                `No static agent with ID <${agentId}> exists in the registry.`
            );
        }

        return this[agentId][propertyKey];
    }

    /** Whether an agent with the given id is stored in the static agent registry. */
    public static hasAgent(agentId: number): boolean {
        return this.hasOwnProperty(agentId);
    }

    /**
     * Whether there exists an agent with the given property in the static agent registry.
     * @param agentId The agent's id.
     * @param propertyKey The name of the property.
     */
    public static hasAgentProperty(
        agentId: number,
        propertyKey: PropertyKey
    ): boolean {
        return (
            this.hasAgent(agentId) && this[agentId].hasOwnProperty(propertyKey)
        );
    }

    /**
     * Deletes all static agents from the registry.
     */
    public static resetRegistry(): void {
        this.agentCount = 0;

        Object.keys(this)
            .filter(propertyIsAgentId)
            .forEach(key => delete this[key]);
    }
}
