/*
 * Contains the current implementation of `InstanceOutput`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider, PKProvider } from "../../common";
import { GameInstanceInternal } from "../../state";
import { InstanceOutputInternal } from "../instance-output-internal";
import { OutputLine, OutputLineType } from "../output-line";

/**
 * Constructs an `InstanceOutputInternal`.
 * @param game The `GameInstance` that owns this `InstanceOutputInternal`.
 * @param pkProvider The existing output PK provider (optional).
 */
export const buildInstanceOutput = (
    game: GameInstanceInternal,
    pkProvider?: PKProvider<OutputLine>
): InstanceOutputInternal => new InstanceOutputImpl(game, pkProvider);

class InstanceOutputImpl implements InstanceOutputInternal {
    public lines: OutputLine[] = [];

    /** The internal `OutputLine` `PKProvider`. */
    private _pkProvider: PKProvider<OutputLine>;

    constructor(
        public game: GameInstanceInternal,
        pkProvider: PKProvider<OutputLine>
    ) {
        this._pkProvider = pkProvider ? pkProvider : buildPKProvider();
    }

    get lineCount() {
        return this._pkProvider.countGenerated();
    }

    public recycle(newInstance: GameInstanceInternal): InstanceOutputInternal {
        return new InstanceOutputImpl(newInstance, this._pkProvider);
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
            id: this._pkProvider.next(),
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
