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

import { ContextManager } from "../state";
import { buildInactiveAgentProxy } from "./impl";
import { StaticAgentRegistry } from "./static-agent-registry";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o !== undefined && (o as Agent).id !== undefined;

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

        return buildInactiveAgentProxy(this);
    }
}
