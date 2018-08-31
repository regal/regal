import { RegalError } from "../error";
import { Agent } from "./agent-model";
import { propertyIsAgentId } from "./instance-agents";

const STATIC_AGENT_PROXY_HANDLER = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = Reflect.get(target, propertyKey);

        if (
            value === undefined &&
            (target.game === undefined ||
                !target.game.agents.agentPropertyWasDeleted(
                    target.id,
                    propertyKey
                ))
        ) {
            value = StaticAgentRegistry.getAgentProperty(
                target.id,
                propertyKey
            );
        }

        return value;
    },

    has(target: Agent, propertyKey: PropertyKey) {
        if (
            target.game !== undefined &&
            target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)
        ) {
            return false;
        }
        return StaticAgentRegistry.hasAgentProperty(target.id, propertyKey);
    }
};

export class StaticAgentRegistry {
    public static agentCount = 0;

    public static addAgent<T extends Agent>(agent: T): T {
        if (agent.isRegistered) {
            throw new RegalError(
                "Cannot create a static version of a registered agent."
            );
        }
        if (agent.isStatic) {
            throw new RegalError(
                "Cannot create more than one static version of an agent."
            );
        }

        const id = ++this.agentCount;
        agent.id = id;
        this[id] = agent;

        return new Proxy(new Agent(agent.id), STATIC_AGENT_PROXY_HANDLER) as T;
    }

    public static getAgentProperty(
        agentId: number,
        propertyKey: PropertyKey
    ): any {
        if (!this.hasOwnProperty(agentId)) {
            throw new RegalError(
                `No static agent with ID <${agentId}> exists in the registry.`
            );
        }

        return this[agentId][propertyKey];
    }

    public static hasAgent(agentId: number): boolean {
        return this.hasOwnProperty(agentId);
    }

    public static hasAgentProperty(
        agentId: number,
        propertyKey: PropertyKey
    ): boolean {
        return (
            this.hasAgent(agentId) && this[agentId].hasOwnProperty(propertyKey)
        );
    }

    public static resetRegistry(): void {
        this.agentCount = 0;

        Object.keys(this)
            .filter(propertyIsAgentId)
            .forEach(key => delete this[key]);
    }
}
