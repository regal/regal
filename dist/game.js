"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const event_1 = require("./event");
const agent_1 = require("./agent");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["OK"] = 0] = "OK";
    ErrorCode[ErrorCode["NOT_YET_IMPLEMENTED"] = 1] = "NOT_YET_IMPLEMENTED";
    ErrorCode[ErrorCode["INVALID_INPUT"] = 2] = "INVALID_INPUT";
    ErrorCode[ErrorCode["INVALID_STATE"] = 3] = "INVALID_STATE";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class RegalError extends Error {
    constructor(message = "") {
        super(`RegalError: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.RegalError = RegalError;
class GameInstance {
    constructor() {
        this.output = [];
        this.queue = [];
        this.events = new event_1.InstanceEvents();
        this.agents = new agent_1.InstanceAgents(this);
        this.state = new agent_1.InstanceState(this);
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
    throw new RegalError("onGameStart has not been implemented by the game developer.");
};
Game._onUserInput = (content, game) => {
    throw new RegalError("onUserInput has not been implemented by the game developer.");
};
exports.Game = Game;
//# sourceMappingURL=game.js.map