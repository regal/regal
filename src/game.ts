import { EventFunction, InstanceEvents } from "./event";
import { InstanceAgents, InstanceState, staticAgentRegistry, Agent } from "./agent";
import { InstanceOutput } from "./output";

export enum ErrorCode {
    OK,
    NOT_YET_IMPLEMENTED,
    INVALID_INPUT,
    INVALID_STATE
}

export class RegalError extends Error {
    code: ErrorCode;

    constructor(message: string = "") {
        super(`RegalError: ${message}`);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class GameInstance {

    agents: InstanceAgents;
    events: InstanceEvents;
    output: InstanceOutput;
    state: any;

    constructor() {
        this.agents = new InstanceAgents(this);
        this.events = new InstanceEvents(this);
        this.output = new InstanceOutput(this);
        this.state = new InstanceState(this);
    }

}

export class Game {

    private static _onGameStart = (): GameInstance => {
        throw new RegalError("onGameStart has not been implemented by the game developer.")
    }
    static get onGameStart() {
        return this._onGameStart;
    }
    static set onGameStart(startFunc: () => GameInstance) {
        this._onGameStart = startFunc;
    }

    private static _onUserInput = (content: string, game: GameInstance): GameInstance => {
        throw new RegalError("onUserInput has not been implemented by the game developer.")
    }
    static get onUserInput() {
        return this._onUserInput;
    }
    static set onUserInput(inputFunc: (content: string, game: GameInstance) => GameInstance) {
        this._onUserInput = inputFunc;
    }
}