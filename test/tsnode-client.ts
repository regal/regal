import * as readline from "readline";
import * as Api from "../src/api";
import { GameInstance } from "../src/gameInstance";

declare const process: any;

export default class Client {
    static game: GameInstance;
    static prompt = "Enter a command: ";
    static quitCommand = "quit";

    static _rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    static handleResponse(response: Api.Response) {
        this.game = response.game;
        response.output.forEach(line => this._rl.write(`${line}\n`));
        this._rl.write("\n");
    }

    static userInput(inp: string) {
        const response = Api.play({
            type: Api.RequestType.USER_INPUT,
            game: this.game,
            content: inp
        });

        this.handleResponse(response);
    }

    static f() {
        this._rl.question(this.prompt, (command: string) => {
            if (command.toLowerCase() === this.quitCommand) {
                this._rl.close();
                return;
            } else {
                this.userInput(command);
                this.f();
            }
        });
    }

    static start() {
        this.handleResponse(Api.play({ type: Api.RequestType.START }));
        this.f();
    }
}