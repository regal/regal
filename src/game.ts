import { EventFunction } from "./event";
import { Agent } from "./agent";

export enum ErrorCode {
    OK,
    NOT_YET_IMPLEMENTED,
    INVALID_INPUT,
    INVALID_STATE
}

export class RegalError extends Error {
    code: ErrorCode;

    constructor(code: ErrorCode, message: string = "") {
        super(`RegalError (${code}) ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = code;
    }
}

export class GameInstance {
    events: string[] = [];
    output: string[] = [];
    queue: EventFunction[] = [];

    state: any;

    agents = new Map<number, object>();

    private _maxInstanceId: number = 0;
    get maxInstanceId(): number {
        return this._maxInstanceId;
    }
    nextInstanceId(): number {
        this._maxInstanceId += 1;
        return this._maxInstanceId;
    }
}

export class Game {

    private static _onGameStart = (): GameInstance => {
        throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onGameStart has not been implemented by the game developer.")
    }
    static get onGameStart() {
        return this._onGameStart;
    }
    static set onGameStart(startFunc: () => GameInstance) {
        this._onGameStart = startFunc;
    }

    private static _onUserInput = (content: string, game: GameInstance): GameInstance => {
        throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onUserInput has not been implemented by the game developer.")
    }
    static get onUserInput() {
        return this._onUserInput;
    }
    static set onUserInput(inputFunc: (content: string, game: GameInstance) => GameInstance) {
        this._onUserInput = inputFunc;
    }

    private static _maxPrefabId = 0;
    private static _prefabMap = new Map<number, Agent>();
    static addPrefab(prefab: Agent): number {
        this._maxPrefabId++;
        this._prefabMap.set(this._maxPrefabId, prefab);
        return this._maxPrefabId;
    }
    static getPrefab(prefabId: number): Agent {
        if (this._prefabMap.has(prefabId)) {
            return this._prefabMap.get(prefabId);
        }
        throw new RegalError(ErrorCode.INVALID_INPUT, `Prefab id ${prefabId} does not exist.`);
    }

}