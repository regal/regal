import { EventFunction } from "./event";
export declare class GameInstance {
    events: string[];
    output: string[];
    queue: EventFunction[];
    state: any;
    constructor();
}
