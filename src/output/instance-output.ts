/*
 * Contains the interface for `InstanceOutput`, the game output manager.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { OutputLine, OutputLineType } from "./output-line";

/**
 * Interface for managing and emitting output through a `GameInstance`.
 *
 * Output is modeled as lines with properties specifying their semantic meaning.
 * For more information, see `OutputLine`.
 */
export interface InstanceOutput {
    /** The number of `OutputLine`s that have been generated over the life of the `GameInstance`. */
    readonly lineCount: number;

    /** The `OutputLine`s generated during the current game cycle. */
    lines: OutputLine[];

    /**
     * Writes a single line of output to the client.
     *
     * @param line The text string to be emitted.
     * @param lineType The line's semantic meaning. (Defaults to `OutputLineType.NORMAL`)
     */
    writeLine(line: string, lineType?: OutputLineType): void;

    /**
     * Writes one or more lines of type `OutputLineType.NORMAL` to the output.
     * @param lines The text to be emitted.
     */
    write(...lines: string[]): void;

    /**
     * Writes one or more lines of type `OutputLineType.NORMAL` to the output.
     * @param lines The text to be emitted.
     */
    writeNormal(...lines: string[]): void;

    /**
     * Writes one or more lines of type `OutputLineType.MAJOR` to the output.
     * @param lines The text to be emitted.
     */
    writeMajor(...lines: string[]): void;

    /**
     * Writes one or more lines of type `OutputLineType.MINOR` to the output.
     * @param lines The text to be emitted.
     */
    writeMinor(...lines: string[]): void;

    /**
     * Writes one or more lines of type `OutputLineType.DEBUG` to the output.
     * @param lines The text to be emitted.
     */
    writeDebug(...lines: string[]): void;

    /**
     * Writes a line of type of `OutputLineType.SECTION_TITLE` to the output.
     * @param line The text to be emitted.
     */
    writeTitle(line: string): void;
}
