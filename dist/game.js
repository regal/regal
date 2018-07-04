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
        super(`RegalError (${code}) ${message}`);
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
        this.agents = new Map();
        this._maxInstanceId = 0;
    }
    get maxInstanceId() {
        return this._maxInstanceId;
    }
    nextInstanceId() {
        this._maxInstanceId += 1;
        return this._maxInstanceId;
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
    static addPrefab(prefab) {
        this._maxPrefabId++;
        this._prefabMap.set(this._maxPrefabId, prefab);
        return this._maxPrefabId;
    }
    static getPrefab(prefabId) {
        if (this._prefabMap.has(prefabId)) {
            return this._prefabMap.get(prefabId);
        }
        throw new RegalError(ErrorCode.INVALID_INPUT, `Prefab id ${prefabId} does not exist.`);
    }
}
Game._onGameStart = () => {
    throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onGameStart has not been implemented by the game developer.");
};
Game._onUserInput = (content, game) => {
    throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED, "onUserInput has not been implemented by the game developer.");
};
Game._maxPrefabId = 0;
Game._prefabMap = new Map();
exports.Game = Game;
