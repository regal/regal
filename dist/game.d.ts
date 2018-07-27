import { EventFunction, InstanceEvents } from "./event";
import { InstanceAgents } from "./agent";
export declare enum ErrorCode {
    OK = 0,
    NOT_YET_IMPLEMENTED = 1,
    INVALID_INPUT = 2,
    INVALID_STATE = 3
}
export declare class RegalError extends Error {
    code: ErrorCode;
    constructor(message?: string);
}
export declare class GameInstance {
    output: string[];
    queue: EventFunction[];
    events: InstanceEvents;
    agents: InstanceAgents;
    state: any;
    constructor();
}
export declare class Game {
    private static _onGameStart;
    static onGameStart: () => GameInstance;
    private static _onUserInput;
    static onUserInput: (content: string, game: GameInstance) => GameInstance;
}
