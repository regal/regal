import { RegalError } from "../../error";
import { GameOptions, OPTION_KEYS } from "../game-options";

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
    checkTypeIfDefined("trackAgentChanges", "boolean");
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
