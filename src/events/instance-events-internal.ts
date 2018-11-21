/*
 * Contains internal interface for InstanceEvents.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";
import { EventRecord } from "./event-record";
import { InstanceEvents } from "./instance-events";

/**
 * Internal interface for InstanceEvents, which manages all
 * events in a GameInstance.
 */
export interface InstanceEventsInternal extends InstanceEvents {
    /** The current `EventRecord`. */
    readonly current: EventRecord;

    /** The ID of the most recently generated `EventRecord`. */
    readonly lastEventId: number;

    /** Contains records of the past events executed during the game cycle. */
    history: EventRecord[];

    /** The `GameInstance` that owns this `InstanceEventsInternal`. */
    readonly game: GameInstance;

    /**
     * Creates a new `InstanceEventsInternal` for the new game cycle, clearing all
     * old events but preserving the last event ID.
     *
     * @param newInstance The new `GameInstance` that will own this `InstanceEventsInternal`.
     */
    recycle(newInstance: GameInstance): InstanceEventsInternal;
}
