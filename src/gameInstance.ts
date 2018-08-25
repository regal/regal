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

}