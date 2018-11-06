/**
 * Contains the manager for all events in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import { EventRecord } from "./event-record";
import { TrackedEvent } from "./event-types";

/**
 * Manager for all events in a `GameInstance`.
 */
export interface InstanceEvents {
    /** The current `EventRecord`. */
    readonly current: EventRecord;

    /** The ID of the most recently generated `EventRecord`. */
    readonly lastEventId: number;

    /** Contains records of the past events executed during the game cycle. */
    history: EventRecord[];

    /** The `GameInstance` that owns this `InstanceEvents`. */
    game: GameInstance;

    /**
     * Executes the given event and all events caused by it.
     * @param event The `TrackedEvent` to be invoked.
     */
    invoke(event: TrackedEvent): void;
}
