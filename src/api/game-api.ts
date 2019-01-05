/*
 * Contains the public-facing API for interaction with a Regal game.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameOptions } from "../config";
import { GameInstance } from "../state";
import { GameResponse } from "./game-response";

/**
 * Public API for interacting with the Regal game.
 *
 * A client application will consume this API, using the endpoints to
 * generate game instances and receive output.
 */
export interface GameApi {
    /**
     * Gets the game's metadata. Note that this is not specific
     * to any `GameInstance`, but refers to the game's static context.
     *
     * @returns A `GameResponse` containing the game's metadata as output,
     * if the request was successful. Otherwise, the response will contain an error.
     */
    getMetadataCommand(): GameResponse;

    /**
     * Submits a command that was entered by the player, usually to trigger
     * some effects in the `GameInstance`.
     *
     * If the `onPlayerCommand` hook has not been implemented, an error will be thrown.
     *
     * @param instance The current game instance (will not be modified).
     * @param command The player's command.
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * values and any output logged during the game cycle's events if the request
     * was successful. Otherwise, the response will contain an error.
     */
    postPlayerCommand(instance: GameInstance, command: string): GameResponse;

    /**
     * Triggers the start of a new game instance.
     *
     * If the `onStartCommand` hook has not been implemented, an error will be thrown.
     *
     * @param options Any option overrides preferred for this specific instance,
     * which must be allowed by the static configuration's `allowOverrides` option.
     *
     * @returns A `GameResponse` containing a new `GameInstance` and any output
     * logged during the game cycle's events if the request was successful.
     * Otherwise, the response will contain an error.
     */
    postStartCommand(options?: Partial<GameOptions>): GameResponse;

    /**
     * Reverts the effects of the last player command on the game instance.
     *
     * Calls the `beforeUndoCommand` hook to determine if the undo is allowed.
     * If the hook has not been implemented, undo is allowed by default.
     *
     * @param instance The current game instance (will not be modified).
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * values if the request was successful. Otherwise, the response will contain an error.
     */
    postUndoCommand(instance: GameInstance): GameResponse;

    /**
     * Updates the values of the named game options in the game instance.
     *
     * @param instance The current game instance (will not be modified).
     * @param options The new option overrides, which must be allowed by the static
     * configuration's `allowOverrides` option.
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * options if the request was successful. Otherwise, the response will contain an error.
     */
    postOptionCommand(
        instance: GameInstance,
        options: Partial<GameOptions>
    ): GameResponse;
}
