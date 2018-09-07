import { InstanceAgents, InstanceState } from "./agents";
import { GameOptions, InstanceOptions } from "./config";
import { InstanceEvents } from "./events";
import { InstanceOutput } from "./output";

export default class GameInstance {
    public agents: InstanceAgents;
    public events: InstanceEvents;
    public output: InstanceOutput;
    public options: InstanceOptions;
    public state: any;

    constructor(options: Partial<GameOptions> = {}) {
        this.agents = new InstanceAgents(this);
        this.events = new InstanceEvents(this);
        this.output = new InstanceOutput(this);
        this.options = new InstanceOptions(this, options);
        this.state = new InstanceState(this);
    }

    public cycle(): GameInstance {
        const newGame = new GameInstance(this.options.overrides);
        newGame.events = this.events.cycle(newGame);
        newGame.agents = this.agents.cycle(newGame);
        newGame.output = this.output.cycle(newGame);

        return newGame;
    }
}
