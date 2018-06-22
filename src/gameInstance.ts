import { EventFunction } from "./event";

export class GameInstance {
    events: string[];
    output: string[];
    queue: EventFunction[];

    constructor() {
        this.events = [];
        this.output = [];
        this.queue = [];
    }
}