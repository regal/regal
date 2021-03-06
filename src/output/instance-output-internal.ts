/*
 * Contains the internal interface for `InstanceOutput`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstanceInternal } from "../state";
import { InstanceOutput } from "./instance-output";

/**
 * Internal interface for `InstanceOutput`.
 */
export interface InstanceOutputInternal extends InstanceOutput {
    /** The `GameInstance` that owns this `InstanceOutput`. */
    readonly game: GameInstanceInternal;

    /**
     * Creates a new `InstanceOutput` for the new game cycle, clearing all
     * old output but preserving the line count.
     *
     * @param newInstance The new `GameInstance` that will own this `InstanceOutput`.
     */
    recycle(newInstance: GameInstanceInternal): InstanceOutputInternal;
}
