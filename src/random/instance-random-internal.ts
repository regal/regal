/*
 * Contains the internal interface for `InstanceRandom`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { FK } from "../common";
import { GameInstanceInternal } from "../state";
import { InstanceRandom } from "./instance-random";
import { RandomRecord } from "./random-record";

/**
 * Internal interface for `InstanceRandom`.
 */
export interface InstanceRandomInternal extends InstanceRandom {
    /** The `GameInstance` that manages this `InstanceRandom`. */
    readonly game: GameInstanceInternal;

    /**
     * The number of values that have been generated over the lifetime of the game.
     *
     * This value is persisted between multiple game cycles so as to ensure that the
     * sequence of pseudo-random data stays consistent for a given seed.
     */
    readonly numGenerations: number;

    /**
     * The key of the last `RandomRecord` that was generated, or the default key if
     * none have been.
     */
    readonly lastKey: FK<RandomRecord>;

    /**
     * Generates a new `InstanceRandomInternal` for the new `GameInstance`, preserving
     * the old `numGenerations` (as `seed` is preserved by the `GameInstance` itself).
     *
     * @param newInstance The new managing `GameInstance`.
     */
    recycle(newInstance: GameInstanceInternal): InstanceRandomInternal;
}
