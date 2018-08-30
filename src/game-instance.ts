import { InstanceEvents } from "./event";
import { InstanceAgents, InstanceState } from "./agent";
import { InstanceOutput } from "./output";

export default class GameInstance {

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

    cycle(): GameInstance {
        const newGame = new GameInstance();
        newGame.events = this.events.cycle(newGame);
        newGame.agents = this.agents.cycle(newGame);
        newGame.output = this.output.cycle(newGame);

        return newGame;
    }
}