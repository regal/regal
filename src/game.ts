import { GameInstance } from "./gameInstance";

export enum ErrorCode {
    OK,
    NOT_YET_IMPLEMENTED,
    INVALID_INPUT
}

export class RegalError extends Error {
    code: ErrorCode;

    constructor(code: ErrorCode, message: string = "") {
        super(`Code: ${code}, Message: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = code;
    }
}

export class Game {

    static _onGameStart = (): GameInstance => {
        throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onGameStart has not been implemented.")
    }
    static get onGameStart() {
        return this._onGameStart;
    }
    static set onGameStart(startFunc: () => GameInstance) {
        this._onGameStart = startFunc;
    }

}