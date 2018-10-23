/**
 * Contains the Agent model and proxies for controlling interaction with agents.
 *
 * Agents are objects that are interacted with by the player in a Regal game.
 * They are managed by the `GameInstance`'s `InstanceAgents` object, which
 * tracks all modifications made to the agent data.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { ContextManager } from "../context-manager";
import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { StaticAgentRegistry } from "./static-agent-registry";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o !== undefined && (o as Agent).id !== undefined;

/**
 * Builds a proxy for an inactive agent. Before an agent is activated
 * by a `GameInstance`, it is considered inactive.
 *
 * Inactive agents are initialize-only, meaning that their properties
 * may optionally be set once, but they may not be read or modified
 * until the agent is activated.
 *
 * An exception to this rule is that inactive agents may be read and
 * modified in the game's static context (i.e. outside of a game cycle).
 * Agents created in the static context are called static agents, and
 * they still must be activated by a `GameInstance` before they can be
 * used in a game cycle.
 *
 * @param agent The agent to be proxied.
 * @returns The inactive agent proxy.
 */
export const inactiveAgentProxy = (agent: Agent): Agent =>
    new Proxy(agent, {
        /** Hidden property that contains any initialized values. */
        tempValues: {},

        get(target: Agent, property: PropertyKey) {
            if (property === "tempValues") {
                return this.tempValues;
            }

            if (
                property !== "id" &&
                property !== "refId" &&
                !ContextManager.isContextStatic()
            ) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be accessed within a game cycle."
                );
            }

            return Reflect.get(target, property);
        },

        set(target: Agent, property: PropertyKey, value: any) {
            if (
                ContextManager.isContextStatic() ||
                (property === "id" && target.id < 0)
            ) {
                return Reflect.set(target, property, value);
            } else if (StaticAgentRegistry.hasAgent(target.id)) {
                throw new RegalError(
                    "This static agent must be activated before it may be modified."
                );
            }

            // Allow initial values to be set (like from a constructor) but ONLY ONCE.
            if (this.tempValues[property] !== undefined) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be set within a game cycle."
                );
            }

            this.tempValues[property] = value;

            return true;
        },

        deleteProperty(target: Agent, property: PropertyKey) {
            if (!ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be deleted within a game cycle."
                );
            }

            return Reflect.deleteProperty(target, property);
        }
    } as ProxyHandler<Agent>);

const activeAgentProxyHandler = (id: number, game: GameInstance) => ({
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
        return {
            configurable: true,
            enumerable: true,
            value: this.get(target, property)
        };
    },

    ownKeys(target: Agent) {
        return game.agents.getAgentPropertyKeys(id);
    }
});

/**
 * Builds a proxy for an active agent. When an inactive agent is activated
 * by a `GameInstance`, it is considered active.
 *
 * The proxy wraps an empty object and has no tangible connection to the agent
 * which it is imitating. All calls to the proxy are forwarded to the
 * `GameInstance`'s `InstanceAgents`, simulating the behavior of normal object.
 *
 * @param id    The proxy agent's id.
 * @param game  The `GameInstance` of the current context.
 */
export const activeAgentProxy = (id: number, game: GameInstance): Agent =>
    new Proxy({} as any, activeAgentProxyHandler(id, game));

export const activeAgentArrayProxy = (id: number, game: GameInstance): Agent =>
    new Proxy([] as any, activeAgentProxyHandler(id, game));

/**
 * An object that is interacted with by the player in a Regal game.
 *
 * Every game object should inherit from `Agent`.
 */
export class Agent {
    /** The agent's unique identifier in the context of the current game. */
    public id: number;

    /**
     * Constructs a new `Agent`. This constructor should almost never be called
     * directly, but rather should be called with `super()`.
     *
     * If called in the game's static context (i.e. outside of a game cycle), a
     * static agent will be created, and an id will be reserved for this agent
     * for all game instances.
     */
    constructor() {
        if (ContextManager.isContextStatic()) {
            this.id = StaticAgentRegistry.getNextAvailableId();
            StaticAgentRegistry.addAgent(this);
        } else {
            this.id = -1;
        }

        return inactiveAgentProxy(this);
    }
}
