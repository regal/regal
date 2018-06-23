import { GameInstance } from "./gameInstance";
import { RegalError, ErrorCode, Game } from "./game";

export enum RequestType {
    USER_INPUT = "User Input",
    ALARM = "Alarm",
    START = "START"
}

export interface Request {
    content?: string;
    game?: GameInstance;
    type: RequestType;
}

export interface Response {
    output?: string[];
    game: GameInstance;
}

export const play = (request: Request): Response => {
    switch (request.type) {
        case RequestType.USER_INPUT:
            throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED);
        
        case RequestType.ALARM:
            throw new RegalError(ErrorCode.NOT_YET_IMPLEMENTED);

        case RequestType.START:
            const game = Game.onGameStart();
            return { game, output: game.output };

        default:
            throw new RegalError(ErrorCode.INVALID_INPUT);
    }
};