/**
 * Contains the `recycleInstanceOutput` function. This is a standalone
 * function rather than a method on `InstanceOutput` so that it is not
 * run accidentally by consumers of the library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../../state";
import { buildInstanceOutput } from "../impl";
import { InstanceOutput } from "../instance-output";

/**
 * Creates a new `InstanceOutput` for the new game cycle, clearing all
 * old output but preserving the line count.
 *
 * @param oldOutput The previous `InstanceOutput`.
 * @param newInstance The new `GameInstance` that will own this `InstanceOutput`.
 */
export const recycleInstanceOutput = (
    oldOutput: InstanceOutput,
    newInstance: GameInstance
) => buildInstanceOutput(newInstance, oldOutput.lineCount);
