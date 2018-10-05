import { ContextManager } from "../context-manager";
import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { StaticAgentRegistry } from "./static-agent-registry";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o && (o as Agent).id !== undefined;

export const inactiveAgentProxy = (agent: Agent): Agent =>
    new Proxy(agent, {
        tempValues: {},

        get(target: Agent, property: PropertyKey) {
            if (property === "tempValues") {
                return this.tempValues;
            }

            if (property !== "id" && !ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be accessed within a game cycle."
                );
            }

            return Reflect.get(target, property);
        },

        set(target: Agent, property: PropertyKey, value: any) {
            if (
                ContextManager.isContextStatic() ||
                (property === "id" && target.id < 0)
            ) {
                return Reflect.set(target, property, value);
            } else if (StaticAgentRegistry.hasAgent(target.id)) {
                throw new RegalError(
                    "This static agent must be activated before it may be modified."
                );
            }

            // Allow initial values to be set (like from a constructor) but ONLY ONCE.
            if (this.tempValues[property] !== undefined) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be set within a game cycle."
                );
            }

            this.tempValues[property] = value;

            return true;
        },

        deleteProperty(target: Agent, property: PropertyKey) {
            if (!ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be deleted within a game cycle."
                );
            }

            return Reflect.deleteProperty(target, property);
        }
    } as ProxyHandler<Agent>);

export const activeAgentProxy = (id: number, game: GameInstance): Agent =>
    new Proxy({} as Agent, {
        get(target: Agent, property: PropertyKey) {
            return game.agents.hasAgentProperty(id, property)
                ? game.agents.getAgentProperty(id, property)
                : Reflect.get(target, property);
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
        if (ContextManager.isContextStatic()) {
            this.id = StaticAgentRegistry.getNextAvailableId();
            StaticAgentRegistry.addAgent(this);
        } else {
            this.id = -1;
        }

        return inactiveAgentProxy(this);
    }
}
