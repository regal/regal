/**
 * Represents game options that are configurable by a Regal client.
 */
export interface GameOptions {

    /** Whether output of type `DEBUG` should be returned to the client. Defaults to false. */
    debug?: boolean;

    /** Whether output of type `MINOR` should be returned to the client. Defaults to true. */
    showMinor?: boolean;

    /** Game options that cannot be changed by a Regal client. Defaults to none. */
    forbidChanges?: string[];
}

/**
 * Metadata about the game, such as its title and author.
 */
export interface GameMetadata {

    /** The game's title. */
    name: string;

    /** The game's author. */
    author?: string;

    /** A brief description of the game. */
    headline?: string;

    /** The full description of the game. */
    description?: string;

    /** The URL of the project's homepage. */
    homepage?: string;

    /** The URL of the project's repository */
    repository?: string;

    /** Default values for the game's options. */
    options: GameOptions;
}