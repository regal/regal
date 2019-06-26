/*
 * Contains the Agent model and proxies for controlling interaction with agents.
 *
 * Agents are objects that are interacted with by the player in a Regal game.
 * They are managed by the `GameInstance`'s `InstanceAgentsInternal` object, which
 * tracks all modifications made to the agent data.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../common";
import { buildInactiveAgentProxy } from "./impl";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o !== undefined && (o as Agent).id !== undefined;

/**
 * A game object, or *agent*, is a JavaScript object that contains Regal game state.
 * Every agent should inherit from the `Agent` class.
 *
 * Before an agent's properties can be accessed in a game cycle,
 * the agent must be activated with `GameInstance.using`.
 * If you try to read or modify the property of an agent that hasn't been activated,
 * a `RegalError` will be thrown.
 */
export class Agent {
    /** The agent's unique identifier in the context of the current game. */
    public readonly id: PK<Agent>;

    /**
     * Constructs a new `Agent`. This constructor should almost never be called
     * directly, but rather should be called with `super()`.
     *
     * If called in the game's static context (i.e. outside of a game cycle), a
     * static agent will be created, and an id will be reserved for this agent
     * for all game instances.
     */
    constructor() {
        return buildInactiveAgentProxy(this);
    }
}
