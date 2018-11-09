import GameInstance from "../../game-instance";
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
