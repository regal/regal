/*
 * Contains the `GameInstance` interface.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { InstanceOptions } from "../config";
import { InstanceEvents } from "../events";
import { InstanceOutput } from "../output";
import { InstancePlugins, RegisteredPlugins } from "../plugins";
import { InstanceRandom } from "../random";

/**
 * Represents a unique instance of a Regal game, containing the game's current
 * state and all interfaces used to interact with the game during a game cycle.
 *
 * Instance state is a snapshot of a Regal game that is unique to a player,
 * containing the modifications caused by all of the player's commands up to that point.
 *
 * A game's static context is immutable data that is the same for every player
 * regardless of their commands, whereas a `GameInstance` is the player's unique
 * instance of the game.
 *
 * @template StateType The state property's type. Optional, defaults to `any`.
 */
export interface GameInstance<
    StateType = any,
    Plugins extends RegisteredPlugins = {}
> {
    /** The manager for all events in the instance. */
    events: InstanceEvents;

    /** The manager for all output in the instance. */
    output: InstanceOutput;

    /** Read-only container for all current options in the instance. */
    options: InstanceOptions;

    /** The manager for generating repeatable random numbers through the game instance. */
    random: InstanceRandom;

    plugins: InstancePlugins<Plugins>;

    /**
     * Free-form agent to contain any instance state desired by the game developer.
     *
     * Properties set within this object are maintained between game cycles, so
     * it should be used to store long-term state.
     */
    state: StateType;

    /**
     * Activates one or more agents in the current game context. All agents
     * must be activated before they can be used.
     *
     * Activating an agent multiple times has no effect.
     *
     * @template T The type of resource that is activated.
     * @param resource Either a single agent, an agent array, or an object
     * where every property is an agent to be activated.
     * @returns Either an activated agent, an agent array, or an object where
     * every property is an activated agent, depending on the structure of `resource`.
     */
    using<T>(resource: T): T;
}
