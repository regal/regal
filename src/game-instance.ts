import { InstanceAgents, InstanceState } from "./agents";
import { InstanceEvents } from "./events";
import { GameOptions, InstanceOptions } from "./game-config";
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
        const newGame = new GameInstance(this.options.optionOverrides);
        newGame.events = this.events.cycle(newGame);
        newGame.agents = this.agents.cycle(newGame);
        newGame.output = this.output.cycle(newGame);

        return newGame;
    }
}
