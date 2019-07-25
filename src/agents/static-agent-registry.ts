/*
 * Contains all agents defined in the static context of the game,
 * known as static agents. These agents have data that is accessible
 * by all `GameInstances` and therefore is not stored in the instance
 * itself, but rather the `StaticAgentRegistry`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { Mutable, PK } from "../common";
import { RegalError } from "../error";
import { Agent, isAgent } from "./agent";
import {
    getInactiveAgentPK,
    propertyIsAgentId,
    STATIC_AGENT_PK_PROVIDER
} from "./impl";
import { initStaticAgentMeta } from "./impl/agent-meta-transformers";
import { isAgentActive } from "./impl/agent-utils";

/**
 * Static class that manages all static agents used in the game.
 */
export class StaticAgentRegistry {
    /**
     * Returns whether the registry contains a static agent with the given id
     * and that agent has the given property.
     *
     * @param id The agent's id.
     * @param property The agent's property.
     */
    public static hasAgentProperty(
        id: PK<Agent>,
        property: PropertyKey
    ): boolean {
        return this.hasAgent(id) && this[id.value()].hasOwnProperty(property);
    }

    /**
     * Gets a property of a static agent.
     *
     * @param agentId The agent's id.
     * @param propertyKey The name of the property.
     * @returns The value of the property.
     */
    public static getAgentProperty(id: PK<Agent>, property: PropertyKey): any {
        if (!this.hasAgent(id)) {
            throw new RegalError(
                `No agent with the id <${id.value()}> exists in the static registry.`
            );
        }

        return this[id.value()][property];
    }

    /** Whether an agent with the given id is stored in the static agent registry. */
    public static hasAgent(id: PK<Agent>): boolean {
        return isAgent(this[id.value()]);
    }

    /**
     * Adds an agent to the registry, setting its id to the next available primary key.
     * @param agent The agent to be added.
     */
    public static addAgent(agent: Agent): void {
        const currentId = agent.meta.id;

        if (currentId !== undefined && !isAgentActive(currentId)) {
            throw new RegalError(
                `Only inactive agents can be added to the static registry. This one already has an id of <${currentId.value()}>.`
            );
        }

        agent.meta = initStaticAgentMeta(agent.meta);

        this[agent.meta.id.value()] = agent;
    }

    /** Removes all agents from the registry and resets the static PK provider. */
    public static reset(): void {
        Object.keys(this)
            .filter(propertyIsAgentId)
            .forEach(key => delete this[key]);
        STATIC_AGENT_PK_PROVIDER.reset();
    }
}
