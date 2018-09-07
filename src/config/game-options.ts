import { RegalError } from "../error";

/**
 * Represents game options that are configurable by a Regal client.
 */
export interface GameOptions {
    /** Whether output of type `DEBUG` should be returned to the client. Defaults to false. */
    debug: boolean;

    /**
     * Game options that cannot be changed by a Regal client.
     * Can be an array of strings or a boolean.
     *
     * If an array of strings, these options will not be configurable by a Regal client.
     * If `true`, no options will be configurable.
     * If `false`, all options will be configurable.
     */
    forbidChanges: string[] | boolean;

    /** Whether output of type `MINOR` should be returned to the client. Defaults to true. */
    showMinor: boolean;
}

export const DEFAULT_GAME_OPTIONS: GameOptions = {
    debug: false,
    forbidChanges: false,
    showMinor: true
};

export const OPTION_KEYS = Object.keys(DEFAULT_GAME_OPTIONS);

export const validateOptions = (options: Partial<GameOptions>): void => {
    // Ensure no extraneous options were included.
    Object.keys(options).forEach(key => {
        if (!OPTION_KEYS.includes(key)) {
            throw new RegalError(`Invalid option name <${key}>.`);
        }
    });

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

    if (options.forbidChanges !== undefined) {
        if (Array.isArray(options.forbidChanges)) {
            options.forbidChanges.forEach(optionName => {
                if (!OPTION_KEYS.includes(optionName)) {
                    throw new RegalError(
                        `The option <${optionName}> does not exist.`
                    );
                }
            });
        } else if (typeof options.forbidChanges !== "boolean") {
            throw new RegalError(
                `The option <forbidChanges> is of type <${typeof options.forbidChanges}>, must be of type <boolean> or <string[]>.`
            );
        }
    }

    checkTypeIfDefined("showMinor", "boolean");
};
