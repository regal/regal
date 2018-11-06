/**
 * Contains metadata about the Regal game. This metadata is defined
 * in the game's static context, meaning that it is the same for all
 * instances of the game.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

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

    /** Any options defined in the game's static configuration. */
    options: Partial<GameOptions>;
}
