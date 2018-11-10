import { GameInstance } from "../../state";
import { buildInstanceEvents } from "../impl";
import { InstanceEvents } from "../instance-events";

/**
 * Creates a new `InstanceEvents` for the new game cycle, clearing all
 * old events but preserving the last event ID.
 *
 * @param oldEvents The previous `InstanceEvents`.
 * @param newInstance The new `GameInstance` that will own this `InstanceEvents`.
 */
export const recycleInstanceEvents = (
    oldEvents: InstanceEvents,
    newInstance: GameInstance
) => buildInstanceEvents(newInstance, oldEvents.lastEventId);
