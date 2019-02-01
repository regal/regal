/*
 * Options for configuring a game instance's behavior.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Configurable options for the game's behavior.
 */
export interface GameOptions {
    /**
     * Game options that can be overridden by a Regal client.
     * Can be an array of strings or a boolean. Defaults to true.
     *
     * If an array of strings, these options will be configurable by a Regal client.
     * Note that `allowOverrides` is never configurable, and including it will throw an error.
     *
     * If `true`, all options except `allowOverrides` will be configurable.
     *
     * If `false`, no options will be configurable.
     */
    readonly allowOverrides: string[] | boolean;

    /** Whether output of type `DEBUG` should be returned to the client. Defaults to false. */
    readonly debug: boolean;

    /** Whether output of type `MINOR` should be returned to the client. Defaults to true. */
    readonly showMinor: boolean;

    /**
     * Whether all changes to agent properties are tracked and returned to the client. Defaults to false.
     *
     * If `false`, only the values of each property at the beginning and end of each game cycle will be
     * recorded.
     *
     * If `true`, all property changes will be recorded.
     */
    readonly trackAgentChanges: boolean;

    /**
     * Optional string used to initialize pseudorandom number generation in each game instance.
     *
     * When multiple instances have the same seed, they will generate the same sequence of random numbers
     * through the `InstanceRandom` API.
     *
     * If left undefined, a random seed will be generated.
     */
    readonly seed: string | undefined;
}

/**
 * Default values for every game option.
 * If any option is not overridden by the developer, its corresponding
 * value in this object will be used.
 */
export const DEFAULT_GAME_OPTIONS: GameOptions = {
    allowOverrides: true,
    debug: false,
    seed: undefined,
    showMinor: true,
    trackAgentChanges: false
};

/** The names of every game option. */
export const OPTION_KEYS = Object.keys(DEFAULT_GAME_OPTIONS);
