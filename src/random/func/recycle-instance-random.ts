import { GameInstance } from "../../state";
import { buildInstanceRandom } from "../impl";
import { InstanceRandom } from "../instance-random";

export const recycleInstanceRandom = (
    oldRandom: InstanceRandom,
    newInstance: GameInstance
) => buildInstanceRandom(newInstance, oldRandom.numGenerations);
