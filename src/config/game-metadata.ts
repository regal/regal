/*
 * Contains the `GameMetadata` interface.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameOptions } from "./game-options";

/**
 * Metadata about the game, such as its title and author.
 *
 * Metadata values can be specified in the optional `regal.json` file
 * or `regal` property of `package.json`, but are not required.
 * If using `regal.json`, the metadata properties should be placed in an
 * object with the key `game`.
 *
 * If any of the metadata properties `name`, `author`, `description`,
 * `homepage`, or `repository` aren't specified, the values of each
 * property with the same name in `package.json` will be used.
 * `regalVersion` should not be specified, as it is set by the library
 * automatically. If a value is passed for `regalVersion`,
 * an error will be thrown.
 *
 * A configuration loading tool like [**regal-bundler**](https://github.com/regal/regal-bundler)
 * is needed if using `regal.json` or the `regal` property in `package.json`.
 * Alternatively, metadata values can be passed explicitly via `GameApiExtended.init()`.
 * Either way, a metadata object with at least the `name` and `author` properties
 * specified is required before a game can receive commands.
 *
 * This metadata is defined in the game's static context, meaning that it is
 * the same for all instances of the game.
 */
export interface GameMetadata {
    /** The game's title. */
    readonly name: string;

    /** The game's author. */
    readonly author: string;

    /** A brief description of the game. */
    readonly headline?: string;

    /** The full description of the game. */
    readonly description?: string;

    /** The URL of the project's homepage. */
    readonly homepage?: string;

    /** The URL of the project's repository. */
    readonly repository?: string;

    /** Any options overrides for the game. */
    readonly options?: Partial<GameOptions>;

    /** The version of the Regal Game Library used by the game. */
    readonly regalVersion?: string;
}

/** The names of every metadata property. */
export const METADATA_KEYS = [
    "name",
    "author",
    "headline",
    "description",
    "homepage",
    "repository",
    "options",
    "regalVersion"
];
