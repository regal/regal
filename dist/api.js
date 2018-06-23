"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameInstance_1 = require("./gameInstance");
const game_1 = require("./game");
var RequestType;
(function (RequestType) {
    RequestType["USER_INPUT"] = "User Input";
    RequestType["ALARM"] = "Alarm";
    RequestType["START"] = "START";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
exports.play = (request) => {
    switch (request.type) {
        case RequestType.USER_INPUT:
            throw new game_1.RegalError(game_1.ErrorCode.NOT_YET_IMPLEMENTED);
        case RequestType.ALARM:
            throw new game_1.RegalError(game_1.ErrorCode.NOT_YET_IMPLEMENTED);
        case RequestType.START:
            return { game: new gameInstance_1.GameInstance(), output: ["Hello!"] };
        default:
            throw new game_1.RegalError(game_1.ErrorCode.INVALID_INPUT);
    }
};
