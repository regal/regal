/*
 * Contains recycleInstanceRandom function.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../../state";
import { buildInstanceRandom } from "../impl";
import { InstanceRandom } from "../instance-random";

/**
 * Generates a new `InstanceRandom` for the new `GameInstance`, preserving
 * the old `numGenerations` (as `seed` is preserved by the `GameInstance` itself).
 * @param oldRandom The `InstanceRandom` of the previous instance.
 * @param newInstance The new managing `GameInstance`.
 */
export const recycleInstanceRandom = (
    oldRandom: InstanceRandom,
    newInstance: GameInstance
) => buildInstanceRandom(newInstance, oldRandom.numGenerations);
