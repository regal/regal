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
