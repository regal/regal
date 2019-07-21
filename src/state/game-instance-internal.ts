/*
 * Contains the internal interface for `GameInstance`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { InstanceAgentsInternal } from "../agents";
import { FK } from "../common";
import { GameOptions, InstanceOptionsInternal } from "../config";
import { EventRecord, InstanceEventsInternal } from "../events";
import { InstanceOutputInternal } from "../output";
import { InstanceRandomInternal } from "../random";
import { GameInstance } from "./game-instance";

/**
 * Internal interface for `GameInstance`.
 * @template StateType The state property's type. Optional, defaults to `any`.
 */
export interface GameInstanceInternal<StateType = any>
    extends GameInstance<StateType> {
    /** The internal interface to the manager for all agents in the instance. */
    agents: InstanceAgentsInternal;

    /** The internal interface to the manager for all events in the instance. */
    events: InstanceEventsInternal;

    /** The internal interface to the manager for all output in the instance. */
    output: InstanceOutputInternal;

    /** The internal interface to all options in the instance (read-only). */
    options: InstanceOptionsInternal;

    /** The internal interface to the manager for generating repeatable random numbers through the game instance. */
    random: InstanceRandomInternal;

    /**
     * Creates a new `GameInstanceInternal` for the new game cycle, leaving this object unchanged.
     *
     * @param newOptions Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     *
     * @returns The new `GameInstanceInternal`, with each manager cycled.
     */
    recycle(newOptions?: Partial<GameOptions>): GameInstanceInternal<StateType>;

    /**
     * Generates a new `GameInstanceInternal` that is a deep copy of the current instance
     * with its changes rolled back to the given `TrackedEvent`. Does not modify this instance.
     *
     * Calls `recycle` implicitly. It's unecessary to call both `recycle` and `revert`.
     *
     * @param revertTo The id of the `TrackedEvent` to which the state will be reverted.
     * Defaults to `EVENT_RESERVED_KEYS.UNTRACKED`. If an argument is given and the
     * `trackAgentChanges` option is disabled, an error will throw.
     */
    revert(revertTo?: FK<EventRecord>): GameInstanceInternal<StateType>;
}
