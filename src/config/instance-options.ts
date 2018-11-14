/**
 * Contains the read-only container for all options in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";
import { GameOptions } from "./game-options";

/**
 * Read-only container that provides an API to view the game instance's current game options.
 */
export interface InstanceOptions extends GameOptions {
    /** The `GameInstance that owns this `InstanceOptions` */
    readonly game: GameInstance;

    /** Options that have had their static values overridden by the client. */
    readonly overrides: Partial<GameOptions>;
}
