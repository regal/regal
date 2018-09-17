/**
 * Contains the Agent model and the handler for proxying interaction with it.
 * Agents are objects in a Regal game that can be modified and tracked by events.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { StaticAgentRegistry } from "./static-agent";

/** Determines whether an object is an `Agent`. */
export const isAgent = (o: any): o is Agent =>
    o && (o as Agent).isRegistered !== undefined;

/**
 * Proxy handler that controls access to `Agent` objects.
 */
export const AGENT_PROXY_HANDLER = {
    // Gets an agent property, either from `InstanceAgents` or the agent itself.
    get(target: Agent, propertyKey: PropertyKey, receiver: object): any {
        let value: any;

        // If the property exists in the instance state, return it.
        if (
            target.isRegistered &&
            target.game.agents.hasAgentProperty(target.id, propertyKey)
        ) {
            value = target.game.agents.getAgentProperty(target.id, propertyKey);
        }
        // If the property never existed in the instance state (i.e. wasn't deleted), return the `Reflect.get`.
        else if (
            target.game === undefined ||
            !target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)
        ) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    // Redirects agent property changes to `InstanceAgents` if said agent is registered.
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

    // Redirects checking if an agent has a property to `InstanceAgents` if said agent is registered.
    has(target: Agent, propertyKey: PropertyKey): boolean {
        return target.isRegistered
            ? target.game.agents.hasAgentProperty(target.id, propertyKey)
            : Reflect.has(target, propertyKey);
    },

    // Redirects deleting an agent property to `InstanceAgents` if said agent is registered.
    deleteProperty(target: Agent, propertyKey: PropertyKey): boolean {
        let result: boolean;

        if (
            target.isRegistered &&
            target.game.agents.hasAgentProperty(target.id, propertyKey) // No use deleting a property if `InstanceAgents` doesn't have it
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

/**
 * A game object that can be modified and tracked by events in a game instance.
 */
export class Agent {
    /**
     * Constructs a new `Agent`. This constructor should almost never be called
     * directly in the context of a game, but rather should be called with `super()`.
     *
     * @param _id The agent's numeric id (use with caution).
     * @param game The agent's assigned game instance (use with caution).
     */
    constructor(private _id?: number, public game?: GameInstance) {
        return new Proxy(this, AGENT_PROXY_HANDLER);
    }

    /** Whether the agent is being tracked by a `GameInstance`. */
    get isRegistered(): boolean {
        return this.game !== undefined && this.game.agents.hasAgent(this.id);
    }

    /** Whether the agent is registered in the game's static context. */
    get isStatic(): boolean {
        return this._id !== undefined && StaticAgentRegistry.hasAgent(this._id);
    }

    /** The agent's numeric id. If the agent is not registered, this will not be defined. */
    get id() {
        return this._id;
    }

    /** If you attempt to set the id after one has already been set, an error will be thrown. */
    set id(value: number) {
        if (this._id !== undefined) {
            throw new RegalError(
                "Cannot change an agent's ID once it has been set."
            );
        }
        this._id = value;
    }

    /**
     * Registers the agent with the current game instance's `InstanceAgents`
     * so that all changes to it are tracked.
     *
     * @param game The current game instance.
     * @param newId The numeric id to assign to the new agent (optional).
     *
     * @returns A proxy to manage all interaction with the newly registered agent.
     */
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

    /**
     * Adds the agent to the game's static agent registry so that
     * its data is stored in the static context of the game, rather than
     * every game instance.
     *
     * Note that modifications to this agent, once it is registered,
     * will not modify the static version, but rather will record the
     * changes in the current game instance's `InstanceAgents`.
     *
     * @returns A proxy to manage all interaction with the static agent.
     */
    public static(): this {
        return StaticAgentRegistry.addAgent(this);
    }
}
