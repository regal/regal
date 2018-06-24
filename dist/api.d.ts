import { GameInstance } from "./game";
export declare enum RequestType {
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
export declare const play: (request: Request) => Response;
