/*
 * Contains functions for validating config options.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../../error";
import { GameOptions, OPTION_KEYS } from "../game-options";

/**
 * Throws an error if the property of the object is not the given type.
 *
 * @param target The object with the property.
 * @param key The name of the property.
 * @param expectedType What the property's type should be.
 * @param allowUndefined Whether an error should be thrown if the property is undefined.
 * @param generalKeyName The general key name to use in error messages (i.e. "option", "key", or "prop").
 */
export const checkPropertyType = <T>(
    target: T,
    key: keyof T,
    expectedType: string,
    allowUndefined: boolean,
    generalKeyName: string
) => {
    const value = target[key];
    const actualType = typeof value;

    if (value !== undefined) {
        if (actualType !== expectedType) {
            throw new RegalError(
                `The ${generalKeyName} <${key}> is of type <${actualType}>, must be of type <${expectedType}>.`
            );
        }
    } else if (!allowUndefined) {
        throw new RegalError(`The ${generalKeyName} <${key}> must be defined.`);
    }
};

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

    const checkOptionType = (key: keyof GameOptions, expectedType: string) =>
        checkPropertyType(options, key, expectedType, true, "option");

    checkOptionType("debug", "boolean");

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

    checkOptionType("showMinor", "boolean");
    checkOptionType("trackAgentChanges", "boolean");
    checkOptionType("seed", "string");
};

/**
 * Given a value of the `allowOverrides` option, throw an error if
 * the attempted option overrides aren't valid.
 *
 * @param overrides The attempted option overrides.
 * @param allowOverrides The `allowOverrides` value to validate against.
 */
export const ensureOverridesAllowed = (
    overrides: Partial<GameOptions>,
    allowOverrides: string[] | boolean
): void => {
    if (overrides.allowOverrides !== undefined) {
        throw new RegalError(
            "The allowOverrides option can never be overridden."
        );
    }

    if (Array.isArray(allowOverrides)) {
        const overrideKeys = Object.keys(overrides);
        const forbiddenKeys = overrideKeys.filter(
            key => !allowOverrides.includes(key)
        );

        if (forbiddenKeys.length > 0) {
            throw new RegalError(
                `The following option overrides are forbidden: <${forbiddenKeys}>.`
            );
        }
    } else {
        // Option is a boolean
        if (!allowOverrides && Object.keys(overrides).length > 0) {
            throw new RegalError("No option overrides are allowed.");
        }
    }
};
