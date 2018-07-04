import { EventFunction } from "./event";
import { Agent } from "./agent";
export declare enum ErrorCode {
    OK = 0,
    NOT_YET_IMPLEMENTED = 1,
    INVALID_INPUT = 2,
    INVALID_STATE = 3
}
export declare class RegalError extends Error {
    code: ErrorCode;
    constructor(code: ErrorCode, message?: string);
}
export declare class GameInstance {
    events: string[];
    output: string[];
    queue: EventFunction[];
    state: any;
    agents: Map<number, object>;
    private _maxInstanceId;
    readonly maxInstanceId: number;
    nextInstanceId(): number;
}
export declare class Game {
    private static _onGameStart;
    static onGameStart: () => GameInstance;
    private static _onUserInput;
    static onUserInput: (content: string, game: GameInstance) => GameInstance;
    private static _maxPrefabId;
    private static _prefabMap;
    static addPrefab(prefab: Agent): number;
    static getPrefab(prefabId: number): Agent;
}
