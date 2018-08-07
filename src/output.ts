import { GameInstance } from "./game";

export class InstanceOutput {

    lines: string[] = [];

    constructor(public game: GameInstance) {}

    write(...lines: string[]) {
        this.lines.push(...lines);
        this.game.events.current.trackOutputWrite(...lines);
    }
}