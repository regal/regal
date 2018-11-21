/*
 * Contains the internal interface for `InstanceRandom`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";
import { InstanceRandom } from "./instance-random";

/**
 * Internal interface for `InstanceRandom`.
 */
export interface InstanceRandomInternal extends InstanceRandom {
    /** The `GameInstance` that manages this `InstanceRandom`. */
    readonly game: GameInstance;

    /**
     * The number of values that have been generated over the lifetime of the game.
     *
     * This value is persisted between multiple game cycles so as to ensure that the
     * sequence of pseudo-random data stays consistent for a given seed.
     */
    readonly numGenerations: number;

    /**
     * Generates a new `InstanceRandomInternal` for the new `GameInstance`, preserving
     * the old `numGenerations` (as `seed` is preserved by the `GameInstance` itself).
     *
     * @param newInstance The new managing `GameInstance`.
     */
    recycle(newInstance: GameInstance): InstanceRandomInternal;
}
