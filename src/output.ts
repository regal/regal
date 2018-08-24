import { GameInstance, RegalError } from "./game";

export enum OutputLineType {
    NORMAL = "NORMAL",
    MAJOR = "MAJOR",
    MINOR = "MINOR",
    DEBUG = "DEBUG",
    SECTION_TITLE = "SECTION_TITLE"
}

export interface OutputLine {
    id: number;
    data: string;
    type: OutputLineType;
}

export class InstanceOutput {

    private lineCount = 0;

    lines: OutputLine[] = [];

    constructor(public game: GameInstance) {}

    writeLine(line: string, lineType: OutputLineType = OutputLineType.NORMAL) {
        const outputLine = <OutputLine>{
            id: ++this.lineCount,
            data: line,
            type: lineType,
        };

        this.lines.push(outputLine)
        this.game.events.current.trackOutputWrite(outputLine);
    }

    write(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    writeNormal(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.NORMAL));
    }

    writeMajor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MAJOR));
    }

    writeMinor(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.MINOR));
    }

    writeDebug(...lines: string[]) {
        lines.forEach(line => this.writeLine(line, OutputLineType.DEBUG));
    }

    writeTitle(line: string) {
        this.writeLine(line, OutputLineType.SECTION_TITLE);
    }
}

export interface GameOutput {
    wasSuccessful: boolean;
    error?: RegalError;
    log?: OutputLine[];
    options?: GameOptions;
    metadata?: GameMetadata;
}

export interface GameOptions {
    debug?: boolean;
    showMinor?: boolean;
}

export interface GameMetadata {
    name: string;
    author: string;
    headline: string;
    description: string;
    homepage: string;
    repository: string;
    options: GameOptions;
}