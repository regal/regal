/*
 * Contains the manager for all events in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { TrackedEvent } from "./event-types";

/**
 * Manager for all events in a `GameInstance`.
 *
 * Every event that occurs on a `GameInstance` passes through this interface.
 */
export interface InstanceEvents {
    /**
     * Executes the given event and all events caused by it.
     * @param event The `TrackedEvent` to be invoked.
     */
    invoke(event: TrackedEvent): void;
}
