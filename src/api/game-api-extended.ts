/*
 * Contains the extended Game API.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameMetadata } from "../config";
import { GameApi } from "./game-api";

/**
 * Extended API for interacting with the Regal game.
 *
 * Contains the standard methods from `GameApi` as well as additional
 * methods for advanced control.
 */
export interface GameApiExtended extends GameApi {
    /** Whether `Game.init()` has been called. */
    readonly isInitialized: boolean;

    /**
     * Initializes the game with the given metadata.
     * This must be called before any game commands may be executed.
     *
     * @param metadata The game's configuration metadata.
     */
    init(metadata: GameMetadata): void;

    /** Resets the game's static classes. */
    reset(): void;
}
