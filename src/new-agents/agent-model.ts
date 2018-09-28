import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    addAgentToStaticRegistry,
    getNextStaticAgentId,
    getStaticAgentProperty,
    isContextStatic
} from "./todo";

const agentReservedProperties = ["id", "game", "isActivated"];

const AGENT_PROXY_HANDLER = {
    get(target: Agent, property: PropertyKey) {
        if (agentReservedProperties.includes(property.toString())) {
            return Reflect.get(target, property);
        }

        if (!target.isActivated) {
            throw new RegalError(
                "The agent has not been activated; that property is not accessible."
            );
        }

        let value = target.game.agents.getAgentProperty(target.id, property);

        if (
            value === undefined &&
            !target.game.agents.agentPropertyWasDeleted(target.id, property)
        ) {
            value = getStaticAgentProperty(target.id, property);
        }

        return value;
    },

    set(target: Agent, property: PropertyKey, value: any): boolean {
        // todo
        return true;
    }
};

export class Agent {
    public id: number;
    public game: GameInstance;
    public isActivated: boolean;

    constructor() {
        this.isActivated = false;

        if (isContextStatic()) {
            this.id = getNextStaticAgentId();
            addAgentToStaticRegistry(this);
        }
        return new Proxy({} as Agent, AGENT_PROXY_HANDLER);
    }
}
