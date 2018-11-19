/*
 * Contains the `recycleInstanceEvents` function. This is a standalone
 * function rather than a method on `InstanceEvents` so that it is not
 * run accidentally by consumers of the library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

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
