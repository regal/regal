import { EventFunction } from "./event";

export enum ErrorCode {
    OK,
    NOT_YET_IMPLEMENTED,
    INVALID_INPUT,
    INVALID_STATE
}

export class RegalError extends Error {
    code: ErrorCode;

    constructor(message: string = "") {
        super(`RegalError: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class GameInstance {
    events: string[] = [];
    output: string[] = [];
    queue: EventFunction[] = [];
}

export class Game {

    private static _onGameStart = (): GameInstance => {
        throw new RegalError("onGameStart has not been implemented by the game developer.")
    }
    static get onGameStart() {
        return this._onGameStart;
    }
    static set onGameStart(startFunc: () => GameInstance) {
        this._onGameStart = startFunc;
    }

    private static _onUserInput = (content: string, game: GameInstance): GameInstance => {
        throw new RegalError("onUserInput has not been implemented by the game developer.")
    }
    static get onUserInput() {
        return this._onUserInput;
    }
    static set onUserInput(inputFunc: (content: string, game: GameInstance) => GameInstance) {
        this._onUserInput = inputFunc;
    }
}