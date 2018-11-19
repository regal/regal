/*
 * Contains interfaces that represent lines of output generated
 * within a Regal game.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Conveys semantic meaning of an `OutputLine` to the client.
 */
export enum OutputLineType {
    /**
     * Standard output line; presented to the player normally. (Default)
     *
     * Use for most game content.
     */
    NORMAL = "NORMAL",

    /**
     * Important line; emphasized to the player.
     *
     * Use when something important happens.
     */
    MAJOR = "MAJOR",

    /**
     * Non-important line; emphasized less than `OutputLineType.NORMAL` lines,
     * and won't always be shown to the player.
     *
     * Use for repetitive/flavor text that might add a bit to the game experience,
     * but won't be missed if it isn't seen.
     */
    MINOR = "MINOR",

    /**
     * Meant for debugging purposes; only visible when the `DEBUG` option is enabled.
     */
    DEBUG = "DEBUG",

    /**
     * Signifies the start of a new section or scene in the game. (i.e. **West of House**)
     */
    SECTION_TITLE = "SECTION_TITLE"
}

/**
 * A line of text that is sent to the client and is meant to notify the player
 * of something that happened in the game.
 */
export interface OutputLine {
    /** The `OutputLine`'s unique identifier */
    id: number;

    /** The text string. */
    data: string;

    /** The line's semantic type. (see `OutputLineType`) */
    type: OutputLineType;
}
