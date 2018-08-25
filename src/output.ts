/**
 * Interfaces for communicating output in the Regal Game Library.
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
 */

import GameInstance from "./game-instance";
import { RegalError } from "./error";
import { GameOptions, GameMetadata } from "./game-config";

/**
 * Conveys semantic meaning of an OutputLine to the client.
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

/**
 * Manager for output in a `GameInstance`.
 * 
 * Contains API for game developers to emit output.
 */
export class InstanceOutput {

    /** The number of `OutputLine`s that have been generated by the `GameInstance`. */
    private lineCount = 0;

    /** The `OutputLine`s generated during the current game cycle. */
    lines: OutputLine[] = [];

    /**
     * Constructs an `InstanceOutput`.
     * @param game The `GameInstance` that owns this `InstanceOutput`.
     */
    constructor(public game: GameInstance) {}

    /**
     * Writes a single line of output to the client.
     * @param line The text string to be emitted.
     * @param lineType The line's semantic meaning. (Defaults to `OutputLineType.NORMAL`)
     */
    writeLine(line: string, lineType: OutputLineType = OutputLineType.NORMAL) {
        const outputLine = <OutputLine>{
            id: ++this.lineCount,
            data: line,
            type: lineType,
        };

        this.lines.push(outputLine)
        this.game.events.current.trackOutputWrite(outputLine);
    }

    /**
     * Writes one or more lines of type `OutputLineType.NORMAL` to the output.
     * @param lines The text to be emitted.
     */
    write(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    /**
     * Writes one or more lines of type `OutputLineType.NORMAL` to the output.
     * @param lines The text to be emitted.
     */
    writeNormal(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    /**
     * Writes one or more lines of type `OutputLineType.MAJOR` to the output.
     * @param lines The text to be emitted.
     */
    writeMajor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MAJOR));
    }

    /**
     * Writes one or more lines of type `OutputLineType.MINOR` to the output.
     * @param lines The text to be emitted.
     */
    writeMinor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MINOR));
    }

    /**
     * Writes one or more lines of type `OutputLineType.DEBUG` to the output.
     * @param lines The text to be emitted.
     */
    writeDebug(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.DEBUG));
    }

    /**
     * Writes a line of type of `OutputLineType.SECTION_TITLE` to the output.
     * @param line The text to be emitted.
     */
    writeTitle(line: string) {
        this.writeLine(line, OutputLineType.SECTION_TITLE);
    }
}

/**
 * Represents the output generated by a request to the `Game` API.
 */
export interface GameOutput {

    /** Whether the request was executed successfully. */
    wasSuccessful: boolean;

    /** The error that was thrown if `wasSuccessful` is false. */
    error?: RegalError;

    /** Contains any lines of output emitted because of the request. */
    log?: OutputLine[];

    /** Contains any game options requested by `Game.getOptionCommand` or updated by `Game.postOptionCommand`. */
    options?: GameOptions;

    /** Contains the game's metadata if `Game.getMetdataCommand` was called. */
    metadata?: GameMetadata;
}