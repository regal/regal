import { GameOptions } from "./game-options";

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
