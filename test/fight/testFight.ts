import { GameInstance } from "../../src/gameInstance";
import * as Api from "../../src/api";
import * as Fight from "./fight";

let game: GameInstance;

Fight.init(); // An init function like this won't actually be needed.

const handleResponse = (response: Api.Response) => {
    game = response.game;
    response.output.forEach(line => console.log(line));
    console.log("");
}

const cmd = (str: string) => {
    const response = Api.play({
        type: Api.RequestType.USER_INPUT,
        game,
        content: str
    });

    handleResponse(response);
};

console.log("Starting game.\n");
handleResponse(Api.play({ type: Api.RequestType.START }));

cmd("knight");
cmd("orc");
cmd("knight");