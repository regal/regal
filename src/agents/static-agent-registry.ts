import { RegalError } from "../error";
import { Agent, isAgent } from "./agent-model";
import { propertyIsAgentId } from "./instance-agents";

export class StaticAgentRegistry {
    public static getNextAvailableId(): number {
        return this._agentCount + 1;
    }

    public static hasAgentProperty(id: number, property: PropertyKey): boolean {
        return this.hasAgent(id) && this[id].hasOwnProperty(property);
    }

    public static getAgentProperty(id: number, property: PropertyKey): any {
        if (!this.hasAgent(id)) {
            throw new RegalError(
                `No agent with the id <${id}> exists in the static registry.`
            );
        }

        return this[id][property];
    }

    public static hasAgent(id: number): boolean {
        return isAgent(this[id]);
    }

    public static addAgent(agent: Agent): void {
        const id = agent.id;

        if (this.hasOwnProperty(id)) {
            throw new RegalError(
                `An agent with the id <${id}> already exists in the static registry.`
            );
        }

        this[id] = agent;
    }

    public static reset(): void {
        this._agentCount = 0;

        Object.keys(this)
            .filter(propertyIsAgentId)
            .forEach(key => delete this[key]);
    }

    private static _agentCount = 0;
}
