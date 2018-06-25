"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
var RequestType;
(function (RequestType) {
    RequestType["USER_INPUT"] = "User Input";
    RequestType["ALARM"] = "Alarm";
    RequestType["START"] = "START";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
exports.play = (request) => {
    let game;
    switch (request.type) {
        case RequestType.USER_INPUT:
            if (!request.content) {
                throw new game_1.RegalError(game_1.ErrorCode.INVALID_INPUT, "Request content must be supplied with a user input request.");
            }
            if (!request.game) {
                throw new game_1.RegalError(game_1.ErrorCode.INVALID_INPUT, "A game instance must be supplied with a user input request.");
            }
            request.game.output = [];
            game = game_1.Game.onUserInput(request.content, request.game);
            break;
        case RequestType.ALARM:
            throw new game_1.RegalError(game_1.ErrorCode.NOT_YET_IMPLEMENTED, "Alarms not yet supported.");
        case RequestType.START:
            game = game_1.Game.onGameStart();
            break;
        default:
            throw new game_1.RegalError(game_1.ErrorCode.INVALID_INPUT, "Invalid request type.");
    }
    return { game, output: game.output };
};