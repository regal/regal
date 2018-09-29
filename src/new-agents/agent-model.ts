import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    addAgentToStaticRegistry,
    getNextStaticAgentId,
    getStaticAgentProperty,
    isContextStatic
} from "./todo";

// const agentReservedProperties = ["id", "game", "isActivated"];

const inactiveAgentProxy = (id?: number): Agent =>
    new Proxy({} as Agent, {
        get(target: Agent, property: PropertyKey) {
            if (property === "id") {
                return id;
            }

            throw new RegalError(
                "The agent has not been activated; that property is not accessible."
            );
        },

        set(target: Agent, property: PropertyKey, value: any) {
            throw new RegalError(
                "The agent has not been activated; that property cannot be set."
            );
        },

        deleteProperty(target: Agent, property: PropertyKey) {
            throw new RegalError(
                "The agent ahs not been activated; that property cannot be deleted."
            );
        }
    });

const activeAgentProxy = (id: number, game: GameInstance): Agent =>
    new Proxy({} as Agent, {
        get(target: Agent, property: PropertyKey) {
            return game.agents.getAgentProperty(id, property);
        },

        set(target: Agent, property: PropertyKey, value: any) {
            return game.agents.setAgentProperty(id, property, value);
        },

        has(target: Agent, property: PropertyKey) {
            return game.agents.hasAgentProperty(id, property);
        },

        deleteProperty(target: Agent, propertyKey: PropertyKey) {
            return game.agents.deleteAgentProperty(id, proeprty);
        }
    });

export class Agent {
    public id: number;
    // public game: GameInstance;

    constructor() {
        let id: number;

        if (isContextStatic()) {
            id = getNextStaticAgentId();
            this.id = id;

            addAgentToStaticRegistry(this);
        }

        return inactiveAgentProxy(id);
    }
}
