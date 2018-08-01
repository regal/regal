import { RegalError, ErrorCode, Game, GameInstance } from "./game";

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
    let game: GameInstance;

    switch (request.type) {
        case RequestType.USER_INPUT:
            if (!request.content) {
                throw new RegalError("Request content must be supplied with a user input request.");
            }
            if (!request.game) {
                throw new RegalError("A game instance must be supplied with a user input request.");
            }

            request.game.output = [];
            
            game = Game.onUserInput(request.content, request.game);
            break;
        
        case RequestType.ALARM:
            throw new RegalError("Alarms not yet supported.");

        case RequestType.START:
             game = Game.onGameStart();
             break;

        default:
            throw new RegalError("Invalid request type.");
    }

    return { game, output: game.output };
};