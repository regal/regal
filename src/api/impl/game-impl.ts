/*
 * Contains the `Game` object that is used to implement `GameApiExtended`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { StaticAgentRegistry, StaticPrototypeRegistry } from "../../agents";
import {
    GameMetadata,
    GameOptions,
    GeneratedGameMetadata,
    MetadataManager
} from "../../config";
import { RegalError } from "../../error";
import { PluginManager } from "../../plugins";
import {
    buildGameInstance,
    ContextManager,
    GameInstance,
    GameInstanceInternal
} from "../../state";
import { HookManager } from "../api-hook-manager";
import { GameApiExtended } from "../game-api-extended";
import { GameResponse, GameResponseOutput } from "../game-response";

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
 * Global implementation of `GameApiExtended`.
 *
 * The `Game` object serves as an exportable API for playing the game.
 * It is used for external interaction with the game, and shouldn't
 * be accessed within the game itself.
 */
// tslint:disable-next-line:variable-name
export const Game = {
    get isInitialized() {
        return this._isInitialized;
    },

    init(metadata: GameMetadata): void {
        if (this._isInitialized) {
            throw new RegalError("Game has already been initialized.");
        }
        this._isInitialized = true;

        ContextManager.init();
        MetadataManager.setMetadata(metadata);
        PluginManager.init();
    },

    reset(): void {
        this._isInitialized = false;
        ContextManager.reset();
        HookManager.reset();
        StaticAgentRegistry.reset();
        MetadataManager.reset();
        StaticPrototypeRegistry.reset();
        PluginManager.reset();
    },

    getMetadataCommand() {
        let metadata: GeneratedGameMetadata;
        let err: RegalError;

        try {
            if (!this._isInitialized) {
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
    },

    postPlayerCommand(instance: GameInstance, command: string): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!this._isInitialized) {
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
    },

    postStartCommand(options?: Partial<GameOptions>): GameResponse {
        let newInstance: GameInstance;
        let err: RegalError;

        try {
            if (!this._isInitialized) {
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
    },

    postUndoCommand(instance: GameInstance): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!this._isInitialized) {
                throw new RegalError(NOT_INITALIZED_ERROR_MSG);
            }
            const oldInstance = instance as GameInstanceInternal;
            validateGameInstance(oldInstance);

            if (!HookManager.beforeUndoCommandHook(instance)) {
                throw new RegalError("Undo is not allowed here.");
            }

            newInstance = oldInstance.revert();
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
    },

    postOptionCommand(
        instance: GameInstance,
        options: Partial<GameOptions>
    ): GameResponse {
        let newInstance: GameInstanceInternal;
        let err: RegalError;

        try {
            if (!this._isInitialized) {
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
    },

    /** Internal variable to track whether this.init has been called. */
    _isInitialized: false
} as GameApiExtended;
