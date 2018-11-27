/*
 * Contains the internal interface for `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { InstanceAgentsInternal } from "../agents";
import { GameOptions, InstanceOptionsInternal } from "../config";
import { InstanceEventsInternal } from "../events";
import { InstanceOutputInternal } from "../output";
import { InstanceRandomInternal } from "../random";
import { GameInstance } from "./game-instance";

/**
 * Internal interface for `GameInstance`.
 */
export interface GameInstanceInternal extends GameInstance {
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
    recycle(newOptions?: Partial<GameOptions>): GameInstanceInternal;

    /**
     * Builds and executes a `TrackedEvent` that reverts all changes in this
     * `GameInstanceInternal` since a specified event.
     *
     * @param source The instance containing agent history on which the revert function
     * will be based. Will not be modified.
     * @param revertTo The id of the `TrackedEvent` to which the state will be reverted.
     */
    simulateRevert(source: GameInstanceInternal, revertTo?: number): void;
}
