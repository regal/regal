import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { StaticAgentRegistry } from "./static-agent";

export const isAgent = (o: any): o is Agent =>
    o && (o as Agent).isRegistered !== undefined;

export const AGENT_PROXY_HANDLER = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object): any {
        let value: any;

        // If the property exists in the instance state, return it.
        if (
            target.isRegistered &&
            target.game.agents.hasAgentProperty(target.id, propertyKey)
        ) {
            value = target.game.agents.getAgentProperty(target.id, propertyKey);
        }
        // If the property never existed in the instance state (i.e. wasn't deleted), return the Reflect.get.
        else if (
            target.game === undefined ||
            !target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)
        ) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    set(
        target: Agent,
        propertyKey: PropertyKey,
        value: any,
        receiver: object
    ): boolean {
        let result: boolean;

        if (target.isRegistered) {
            const currentEvent = target.game.events.current;
            result = target.game.agents.setAgentProperty(
                target.id,
                propertyKey,
                value,
                currentEvent
            );
        } else {
            result = Reflect.set(target, propertyKey, value, receiver);
        }

        return result;
    },

    has(target: Agent, propertyKey: PropertyKey): boolean {
        return target.isRegistered
            ? target.game.agents.hasAgentProperty(target.id, propertyKey)
            : Reflect.has(target, propertyKey);
    },

    deleteProperty(target: Agent, propertyKey: PropertyKey): boolean {
        let result: boolean;

        if (
            target.isRegistered &&
            target.game.agents.hasAgentProperty(target.id, propertyKey)
        ) {
            const currentEvent = target.game.events.current;
            result = target.game.agents.deleteAgentProperty(
                target.id,
                propertyKey,
                currentEvent
            );
        } else {
            result = Reflect.deleteProperty(target, propertyKey);
        }

        return result;
    }
};

export class Agent {
    constructor(private _id?: number, public game?: GameInstance) {
        return new Proxy(this, AGENT_PROXY_HANDLER);
    }

    get isRegistered(): boolean {
        return this.game !== undefined && this.game.agents.hasAgent(this.id);
    }

    get isStatic(): boolean {
        return this._id !== undefined && StaticAgentRegistry.hasAgent(this._id);
    }

    get id() {
        return this._id;
    }

    set id(value: number) {
        if (this._id !== undefined) {
            throw new RegalError(
                "Cannot change an agent's ID once it has been set."
            );
        }
        this._id = value;
    }

    public register(game: GameInstance, newId?: number): this {
        if (!game) {
            throw new RegalError(
                "The GameInstance must be defined to register the agent."
            );
        }
        if (this.isRegistered) {
            throw new RegalError("Cannot register an agent more than once.");
        }

        if (newId !== undefined) {
            if (newId < 0) {
                throw new RegalError("newId must be positive.");
            }
            if (StaticAgentRegistry.hasAgent(newId)) {
                throw new RegalError(
                    `A static agent already has the ID <${newId}>.`
                );
            }

            this.id = newId;
        } else if (!this.isStatic) {
            this.id = game.agents.getNextAgentId();
        }

        this.game = game;

        const currentEvent = game.events.current;
        game.agents.addAgent(this, currentEvent);

        return this;
    }

    public static(): this {
        return StaticAgentRegistry.addAgent(this);
    }
}
