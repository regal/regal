/*
 * Contains the public-facing API for interaction with a Regal game.
 *
 * A client application will consume this API, using the endpoints to
 * modify the game and receive output.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { StaticAgentRegistry } from "../agents";
import { GameMetadata, GameOptions, MetadataManager } from "../config";
import { RegalError } from "../error";
import {
    buildGameInstance,
    ContextManager,
    GameInstance,
    GameInstanceInternal
} from "../state";
import { HookManager } from "./api-hook-manager";
import { GameResponse, GameResponseOutput } from "./game-response";

/**
 * Throws an error if `instance` or any of its properties are undefined.
 * @param instance The `GameInstance` to validate.
 */
const validateGameInstance = (instance: GameInstanceInternal): void => {
    if (
        instance === undefined ||
        instance.agents === undefined ||
        instance.events === undefined ||
        instance.output === undefined ||
        instance.state === undefined
    ) {
        throw new RegalError("Invalid GameInstance.");
    }
};

/**
 * Wraps an error into a `RegalError` (if it's not already) that is
 * parseable by a `GameResponse`.
 *
 * @param err Some error object; should have `name`, `stack`, and `message` properties.
 */
const wrapApiErrorAsRegalError = (err: any): RegalError => {
    if (!err || !err.name || !err.stack || !err.message) {
        return new RegalError("Invalid error object.");
    }

    // If err is already a RegalError, return it
    if (err.message.indexOf("RegalError:") !== -1) {
        return err;
    }

    // Else, create a RegalError
    const msg = `An error occurred while executing the request. Details: <${
        err.name
    }: ${err.message}>`;
    const newErr = new RegalError(msg);
    newErr.stack = err.stack;

    return newErr;
};

/**
 * Helper function to build a `GameResponse` based on the return values of
 * `Game.postPlayerCommand` or `Game.postStartCommand`, including any output logs.
 *
 * @param err Any error that was thrown. If defined, the response will be considered failed.
 * @param newInstance The new `GameInstance` to be returned to the client.
 */
const buildLogResponse = (
    err: RegalError,
    newInstance: GameInstance
): GameResponse => {
    let response: GameResponse;

    if (err !== undefined) {
        const output: GameResponseOutput = {
            error: err,
            wasSuccessful: false
        };
        response = {
            output
        };
    } else {
        const output: GameResponseOutput = {
            log: newInstance.output.lines,
            wasSuccessful: true
        };
        response = {
            instance: newInstance,
            output
        };
    }

    return response;
};

const NOT_INITALIZED_ERROR_MSG =
    "Game has not been initalized. Did you remember to call Game.init?";

/**
 * Game API static class.
 *
 * Each method returns a `GameResponse` and does not modify
 * any arguments passed into it.
 */
export class Game {
    /** Whether `Game.init` has been called. */
    public static get isInitialized() {
        return this._isInitialized;
    }

    /**
     * Initializes the game with the given metadata.
     * This must be called before any game commands may be executed.
     *
     * @param metadata The game's configuration metadata.
     */
    public static init(metadata: GameMetadata): void {
        if (Game._isInitialized) {
            throw new RegalError("Game has already been initialized.");
        }
        Game._isInitialized = true;

        ContextManager.init();
        MetadataManager.setMetadata(metadata);
    }

    /** Resets the game's static classes. */
    public static reset(): void {
        Game._isInitialized = false;
        ContextManager.reset();
        HookManager.reset();
        StaticAgentRegistry.reset();
        MetadataManager.reset();
    }

    /**
     * Gets the game's metadata. Note that this is not specific
     * to any `GameInstance`, but refers to the game's static context.
     *
     * @returns A `GameResponse` containing the game's metadata as output,
     * if the request was successful. Otherwise, the response will contain an error.
     */
    public static getMetadataCommand(): GameResponse {
        let metadata: GameMetadata;
        let err: RegalError;

        try {
            if (!Game._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            metadata = MetadataManager.getMetadata();
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        const output =
            err !== undefined
                ? { error: err, wasSuccessful: false }
                : { metadata, wasSuccessful: true };

        return { output };
    }

    /**
     * Submits a command that was entered by the player, usually to trigger
     * some effects in the `GameInstance`.
     *
     * If the `onPlayerCommand` hook has not been implemented by the game
     * developer, an error will be thrown.
     *
     * @param instance The current game instance (will not be modified).
     * @param command The player's command.
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * values and any output logged during the game cycle's events, if the request
     * was successful. Otherwise, the response will contain an error.
     */
    public static postPlayerCommand(
        instance: GameInstance,
        command: string
    ): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!Game._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            const oldInstance = instance as GameInstanceInternal;
            validateGameInstance(oldInstance);

            if (command === undefined) {
                throw new RegalError("Command must be defined.");
            }
            if (HookManager.playerCommandHook === undefined) {
                throw new RegalError(
                    "onPlayerCommand has not been implemented by the game developer."
                );
            }

            newInstance = oldInstance.recycle();
            newInstance.agents.scrubAgents();

            const activatedEvent = HookManager.playerCommandHook(command);
            newInstance.events.invoke(activatedEvent);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return buildLogResponse(err, newInstance);
    }

    /**
     * Triggers the start of a new game instance.
     *
     * If the `onStartCommand` hook has not been implemented by the game
     * developer, an error will be thrown.
     *
     * @param options Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     *
     * @returns A `GameResponse` containing a new `GameInstance` and any output
     * logged during the game cycle's events, if the request was successful.
     * Otherwise, the response will contain an error.
     */
    public static postStartCommand(
        options: Partial<GameOptions> = {}
    ): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            if (!Game._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            if (HookManager.startCommandHook === undefined) {
                throw new RegalError(
                    "onStartCommand has not been implemented by the game developer."
                );
            }

            newInstance = buildGameInstance(options);
            newInstance.events.invoke(HookManager.startCommandHook);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return buildLogResponse(err, newInstance);
    }

    /**
     * Reverts the effects of the last command that modified the game instance.
     * (A `postPlayerCommand`, `postStartCommand`, or `postUndoCommand`)
     *
     * Calls the `beforeUndoCommand` hook to determine if the undo is allowed.
     * If the hook has not been implemented, undo is allowed by default.
     *
     * @param instance The current game instance (will not be modified).
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * values, if the request was successful. Otherwise, the response will contain an error.
     */
    public static postUndoCommand(instance: GameInstance): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!Game._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            const oldInstance = instance as GameInstanceInternal;
            validateGameInstance(oldInstance);

            if (!HookManager.beforeUndoCommandHook(instance)) {
                throw new RegalError("Undo is not allowed here.");
            }

            newInstance = oldInstance.recycle();
            newInstance.agents.simulateRevert(oldInstance.agents);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return err !== undefined
            ? {
                  output: {
                      error: err,
                      wasSuccessful: false
                  }
              }
            : {
                  instance: newInstance,
                  output: {
                      wasSuccessful: true
                  }
              };
    }

    /**
     * Updates the values of the named game options in the `GameInstance`.
     *
     * @param instance The current game instance (will not be modified).
     * @param options The new option overrides. Must be allowed by the static
     * configuration's `allowOverrides` option.
     *
     * @returns A `GameResponse` containing a new `GameInstance` with updated
     * options, if the request was successful. Otherwise, the response will contain an error.
     */
    public static postOptionCommand(
        instance: GameInstance,
        options: Partial<GameOptions>
    ): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!Game._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            const oldInstance = instance as GameInstanceInternal;
            validateGameInstance(oldInstance);

            const oldOverrideKeys = Object.keys(oldInstance.options.overrides);
            const newOptionKeys = Object.keys(options);

            const newOptions: Partial<GameOptions> = {};

            oldOverrideKeys
                .filter(key => !newOptionKeys.includes(key))
                .forEach(key => (newOptions[key] = oldInstance.options[key]));
            newOptionKeys.forEach(key => (newOptions[key] = options[key]));

            newInstance = oldInstance.recycle(newOptions);
        } catch (error) {
            err = wrapApiErrorAsRegalError(error);
        }

        return err !== undefined
            ? {
                  output: {
                      error: err,
                      wasSuccessful: false
                  }
              }
            : {
                  instance: newInstance,
                  output: {
                      wasSuccessful: true
                  }
              };
    }

    /** Internal variable to track whether Game.init has been called. */
    private static _isInitialized: boolean = false;
}
