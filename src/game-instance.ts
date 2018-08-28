import { InstanceEvents } from "./event";
import { InstanceAgents, InstanceState } from "./agent";
import { InstanceOutput } from "./output";

export default class GameInstance {

    agents: InstanceAgents;
    events: InstanceEvents;
    output: InstanceOutput;
    state: any;

    constructor(former?: GameInstance) {
        if (former) {
            this.agents = former.agents.cycle(this);
            this.events = former.events.cycle(this);
            this.output = former.output.cycle(this);
        } else {
            this.agents = new InstanceAgents(this);
            this.events = new InstanceEvents(this);
            this.output = new InstanceOutput(this);
        }

        this.state = new InstanceState(this);
    }

    cycle(): GameInstance {
        return new GameInstance(this);
    }
}