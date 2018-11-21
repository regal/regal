/*
 * Contains the current implementation of `InstanceOutput`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstanceInternal } from "../../state";
import { InstanceOutputInternal } from "../instance-output-internal";
import { OutputLine, OutputLineType } from "../output-line";

/**
 * Constructs an `InstanceOutputInternal`.
 * @param game The `GameInstance` that owns this `InstanceOutputInternal`.
 * @param startingLineCount Optional starting ID for new `OutputLine`s. Defaults to 0.
 */
export const buildInstanceOutput = (
    game: GameInstanceInternal,
    startingLineCount: number = 0
): InstanceOutputInternal => new InstanceOutputImpl(game, startingLineCount);

class InstanceOutputImpl implements InstanceOutputInternal {
    public lines: OutputLine[] = [];

    /**
     * Internal member for the number of `OutputLine`s that have been
     * generated by the `GameInstance`.
     */
    private _lineCount: number;

    constructor(public game: GameInstanceInternal, startingLineCount: number) {
        this._lineCount = startingLineCount;
    }

    get lineCount() {
        return this._lineCount;
    }

    public recycle(newInstance: GameInstanceInternal): InstanceOutputInternal {
        return new InstanceOutputImpl(newInstance, this.lineCount);
    }

    public writeLine(
        line: string,
        lineType: OutputLineType = OutputLineType.NORMAL
    ) {
        switch (lineType) {
            case OutputLineType.DEBUG:
                if (!this.game.options.debug) {
                    return;
                }
                break;
            case OutputLineType.MINOR:
                if (!this.game.options.showMinor) {
                    return;
                }
                break;
        }

        const outputLine = {
            data: line,
            id: ++this._lineCount,
            type: lineType
        } as OutputLine;

        this.lines.push(outputLine);
        this.game.events.current.trackOutputWrite(outputLine);
    }

    public write(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    public writeNormal(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    public writeMajor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MAJOR));
    }

    public writeMinor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MINOR));
    }

    public writeDebug(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.DEBUG));
    }

    public writeTitle(line: string) {
        this.writeLine(line, OutputLineType.SECTION_TITLE);
    }
}
