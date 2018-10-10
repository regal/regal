import { RegalError } from "../error";
import { Agent, isAgent } from "./agent-model";
import { propertyIsAgentId } from "./instance-agents";

/**
 * Static class that manages all static agents used in the game.
 */
export class StaticAgentRegistry {
    /** Gets the next available id for a newly instantiated static agent. */
    public static getNextAvailableId(): number {
        return this._agentCount + 1;
    }

    /**
     * Returns whether the registry contains a static agent with the given id
     * and that agent has the given property.
     * @param id        The agent's id.
     * @param property  The agent's property.
     */
    public static hasAgentProperty(id: number, property: PropertyKey): boolean {
        return this.hasAgent(id) && this[id].hasOwnProperty(property);
    }

    /**
     * Gets a property of a static agent.
     *
     * @param agentId       The agent's id.
     * @param propertyKey   The name of the property.
     * @returns             The value of the property.
     */
    public static getAgentProperty(id: number, property: PropertyKey): any {
        if (!this.hasAgent(id)) {
            throw new RegalError(
                `No agent with the id <${id}> exists in the static registry.`
            );
        }

        return this[id][property];
    }

    /** Whether an agent with the given id is stored in the static agent registry. */
    public static hasAgent(id: number): boolean {
        return isAgent(this[id]);
    }

    /**
     * Adds an agent to the registry. Will error if the agent's id doesn't
     * equal the registry's next available id.
     * @param agent     The agent to be added.
     */
    public static addAgent(agent: Agent): void {
        const id = agent.id;

        if (id !== this.getNextAvailableId()) {
            throw new RegalError(
                `Expected an agent with id <${this.getNextAvailableId()}>.`
            );
        }

        this[id] = agent;
        this._agentCount++;
    }

    /** Removes all agents from the registry. */
    public static reset(): void {
        this._agentCount = 0;

        Object.keys(this)
            .filter(propertyIsAgentId)
            .forEach(key => delete this[key]);
    }

    private static _agentCount = 0;
}
