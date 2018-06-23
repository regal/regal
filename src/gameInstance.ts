import { EventFunction } from "./event";

export class GameInstance {
    events: string[];
    output: string[];
    queue: EventFunction[];
    state: any;

    constructor() {
        this.events = [];
        this.output = [];
        this.queue = [];
    }
}