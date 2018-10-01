import { ContextManager } from "../context-manager";
import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { StaticAgentRegistry } from "./static-agent-registry";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o && (o as Agent).id !== undefined;

export const inactiveAgentProxy = (agent: Agent): Agent =>
    new Proxy(agent, {
        get(target: Agent, property: PropertyKey) {
            if (property !== "id" && !ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be accessed within a game cycle."
                );
            }

            return Reflect.get(target, property);
        },

        set(target: Agent, property: PropertyKey, value: any) {
            if (!ContextManager.isContextStatic()) {
                // TODO - start looking here
                if (Reflect.get(target, property) !== undefined) {
                    throw new RegalError(
                        "The properties of an inactive agent cannot be set within a game cycle."
                    );
                }
            }

            return Reflect.set(target, property, value);
        },

        deleteProperty(target: Agent, property: PropertyKey) {
            if (!ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be deleted within a game cycle."
                );
            }

            return Reflect.deleteProperty(target, property);
        }
    });

export const activeAgentProxy = (id: number, game: GameInstance): Agent =>
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

        deleteProperty(target: Agent, property: PropertyKey) {
            return game.agents.deleteAgentProperty(id, property);
        }
    });

export class Agent {
    public id: number;

    constructor() {
        let id: number;

        if (ContextManager.isContextStatic()) {
            id = StaticAgentRegistry.getNextAvailableId();
            this.id = id;

            StaticAgentRegistry.addAgent(this);
        }

        return inactiveAgentProxy(this);
    }
}
