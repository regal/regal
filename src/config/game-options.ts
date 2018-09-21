/**
 * Options for configuring a game instance's behavior.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";

/**
 * Represents game options that are configurable by a Regal client.
 */
export interface GameOptions {
    /**
     * Game options that can be overridden by a Regal client.
     * Can be an array of strings or a boolean. Defaults to true.
     *
     * If an array of strings, these options will be configurable by a Regal client.
     * Note that `allowOptions` is never configurable, and including it will throw an error.
     *
     * If `true`, all options except `allowOverrides` will be configurable.
     *
     * If `false`, no options will be configurable.
     */
    allowOverrides: string[] | boolean;

    /** Whether output of type `DEBUG` should be returned to the client. Defaults to false. */
    debug: boolean;

    /** Whether output of type `MINOR` should be returned to the client. Defaults to true. */
    showMinor: boolean;
}

/**
 * Default values for every game option.
 * If any option is not overridden by the developer, its corresponding
 * value in this object will be used.
 */
export const DEFAULT_GAME_OPTIONS: GameOptions = {
    allowOverrides: true,
    debug: false,
    showMinor: true
};

/** The names of every game option. */
export const OPTION_KEYS = Object.keys(DEFAULT_GAME_OPTIONS);

/**
 * Throws an error if any of the given options are invalid.
 * @param options Any game options.
 */
export const validateOptions = (options: Partial<GameOptions>): void => {
    // Ensure no extraneous options were included.
    Object.keys(options).forEach(key => {
        if (!OPTION_KEYS.includes(key)) {
            throw new RegalError(`Invalid option name <${key}>.`);
        }
    });

    // Helper function that ensures the given property has the correct type if it's defined.
    const checkTypeIfDefined = (
        key: keyof GameOptions,
        expectedType: string
    ): void => {
        const value = options[key];
        const actualType = typeof value;

        if (options[key] !== undefined) {
            if (actualType !== expectedType) {
                throw new RegalError(
                    `The option <${key}> is of type <${actualType}>, must be of type <${expectedType}>.`
                );
            }
        }
    };

    checkTypeIfDefined("debug", "boolean");

    // Validate allowOverrides
    if (options.allowOverrides !== undefined) {
        if (Array.isArray(options.allowOverrides)) {
            // Ensure every option name in the list is a real option.
            options.allowOverrides.forEach(optionName => {
                if (!OPTION_KEYS.includes(optionName)) {
                    throw new RegalError(
                        `The option <${optionName}> does not exist.`
                    );
                }
            });

            // Ensure that allowOverrides is not included in the list.
            if (options.allowOverrides.includes("allowOverrides")) {
                throw new RegalError(
                    "The option <allowOverrides> is not allowed to be overridden."
                );
            }
        } else if (typeof options.allowOverrides !== "boolean") {
            throw new RegalError(
                `The option <allowOverrides> is of type <${typeof options.allowOverrides}>, must be of type <boolean> or <string[]>.`
            );
        }
    }

    checkTypeIfDefined("showMinor", "boolean");
};
