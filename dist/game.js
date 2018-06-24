"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["OK"] = 0] = "OK";
    ErrorCode[ErrorCode["NOT_YET_IMPLEMENTED"] = 1] = "NOT_YET_IMPLEMENTED";
    ErrorCode[ErrorCode["INVALID_INPUT"] = 2] = "INVALID_INPUT";
    ErrorCode[ErrorCode["INVALID_STATE"] = 3] = "INVALID_STATE";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class RegalError extends Error {
    constructor(code, message = "") {
        super(`Code: ${code}, Message: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = code;
    }
}
exports.RegalError = RegalError;
class GameInstance {
    constructor() {
        this.events = [];
        this.output = [];
        this.queue = [];
    }
}
exports.GameInstance = GameInstance;
class Game {
    static get onGameStart() {
        return this._onGameStart;
    }
    static set onGameStart(startFunc) {
        this._onGameStart = startFunc;
    }
    static get onUserInput() {
        return this._onUserInput;
    }
    static set onUserInput(inputFunc) {
        this._onUserInput = inputFunc;
    }
}
Game._onGameStart = () => {
    throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onGameStart has not been implemented by the game developer.");
};
Game._onUserInput = (content, game) => {
    throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onUserInput has not been implemented by the game developer.");
};
exports.Game = Game;
