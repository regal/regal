/*
 * A `GameInstance` is the object representation of a game's instance state.
 *
 * Instance state is a snapshot of a Regal game that is unique to a player,
 * containing the modifications made by all of the player's commands up to that point.
 *
 * Whereas the game's static context is immutable data that is the same for
 * every player regardless of their commands, a `GameInstance` is the player's game.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { InstanceAgentsInternal } from "../agents";
import { GameOptions, InstanceOptionsInternal } from "../config";
import { InstanceEventsInternal } from "../events";
import { InstanceOutputInternal } from "../output";
import { InstanceRandom } from "../random";

/**
 * The current state of the game, unique to each player.
 *
 * Contains all internal APIs used by game developers to
 * read and write to the game's instance state.
 */
export interface GameInstance {
    /** The manager for all agents in the instance. */
    agents: InstanceAgentsInternal;

    /** The manager for all events in the instance. */
    events: InstanceEventsInternal;

    /** The manager for all output in the instance. */
    output: InstanceOutputInternal;

    /** Contains all options in the instance (read-only). */
    options: InstanceOptionsInternal;

    /** The manager for generating repeatable random numbers through the game instance. */
    random: InstanceRandom;

    /**
     * Free-form agent to contain any instance state desired by the game developer.
     *
     * Properties set within this object are maintained between game cycles, so
     * it should be used to store long-term state.
     */
    state: any;

    /**
     * Creates a new `GameInstance` for the new game cycle, leaving this object unchanged.
     * **Don't call this unless you know what you're doing.**
     *
     * @param newOptions Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     *
     * @returns The new `GameInstance`, with each manager cycled.
     */
    recycle(newOptions?: Partial<GameOptions>): GameInstance;

    /**
     * Activates one or more agents in the current game context. All agents
     * must be activated before they can be used. Activating an agent multiple
     * times has no effect.
     *
     * @param resource Either a single agent, an agent array, or an object
     * where every property is an agent to be activated.
     * @returns Either an activated agent, an agent array, or an object where
     * every property is an activated agent, depending on the structure of `resource`.
     */
    using<T>(resource: T): T;
}
