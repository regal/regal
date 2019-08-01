/*
 * Contains constructors for active agent proxies.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstanceInternal } from "../../state";
import { Agent } from "../agent";
import { AgentId } from "../agent-meta";

/** Builds the proxy handler for an active agent proxy. */
const activeAgentProxyHandler = (id: AgentId, game: GameInstanceInternal) => ({
    get(target: Agent, property: PropertyKey) {
        return game.agents.hasAgentProperty(id, property)
            ? game.agents.getAgentProperty(id, property)
            : Reflect.get(target, property);
    },

    set(target: Agent, property: PropertyKey, value: any) {
        return game.agents.setAgentProperty(id, property, value);
    },

    has(target: Agent, property: PropertyKey) {
        return game.agents.hasAgentProperty(id, property);
    },

    deleteProperty(target: Agent, property: PropertyKey) {
        return game.agents.deleteAgentProperty(id, property);
    },

    getOwnPropertyDescriptor(target: Agent, property: PropertyKey) {
        if (property === "length" && target instanceof Array) {
            return Reflect.getOwnPropertyDescriptor(target, property);
        } else {
            return {
                configurable: true,
                enumerable: true,
                value: this.get(target, property)
            };
        }
    },

    ownKeys(target: Agent) {
        return game.agents.getAgentPropertyKeys(id);
    },

    getPrototypeOf(target: Agent) {
        return Object.getPrototypeOf(target);
    }
});

/**
 * Builds a proxy for an active agent. When an inactive agent is activated
 * by a `GameInstance`, it is considered active.
 *
 * The proxy wraps an empty object and has no tangible connection to the agent
 * which it is imitating. All calls to the proxy are forwarded to the
 * `GameInstance`'s `InstanceAgentsInternal`, simulating the behavior of normal object.
 *
 * @param id    The proxy agent's id.
 * @param game  The `GameInstance` of the current context.
 */
export const buildActiveAgentProxy = (
    id: AgentId,
    game: GameInstanceInternal
): Agent => new Proxy({} as any, activeAgentProxyHandler(id, game));

/**
 * Builds a proxy for an active agent array. An agent array is an array
 * that is treated like an agent. All arrays that are properties of
 * active agents become agent arrays.
 *
 * An agent array has all the same methods as a regular array.
 *
 * @param id    The agent array's id.
 * @param game  The `GameInstance` of the current context.
 */
export const buildActiveAgentArrayProxy = (
    id: AgentId,
    game: GameInstanceInternal
): Agent => new Proxy([] as any, activeAgentProxyHandler(id, game));
