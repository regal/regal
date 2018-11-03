/**
 * A `GameInstance` is the object representation of a game's instance state.
 *
 * Instance state is a snapshot of a Regal game that is unique to a player,
 * containing the modifications made by all of the player's commands up to that point.
 *
 * Whereas the game's static context is immutable data that is the same for
 * every player regardless of their commands, a `GameInstance` is the player's game.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import {
    activateAgent,
    activeAgentProxy,
    buildInstanceAgents,
    InstanceAgents,
    isAgent,
    recycleInstanceAgents
} from "./agents";
import { GameOptions, InstanceOptions } from "./config";
import { ContextManager } from "./context-manager";
import { RegalError } from "./error";
import { InstanceEvents } from "./events";
import { InstanceOutput } from "./output";

/**
 * The current state of the game, unique to each player.
 *
 * Contains all internal APIs used by game developers to
 * read and write to the game's instance state.
 */
export default class GameInstance {
    /** The manager for all agents in the instance. */
    public agents: InstanceAgents;

    /** The manager for all events in the instance. */
    public events: InstanceEvents;

    /** The manager for all output in the instance. */
    public output: InstanceOutput;

    /** Contains all options in the instance (read-only). */
    public options: InstanceOptions;

    /**
     * Free-form agent to contain any instance state desired by the game developer.
     *
     * Properties set within this object are maintained between game cycles, so
     * it should be used to store long-term state.
     */
    public state: any;

    /**
     * Constructs a new `GameInstance` with optional `GameOption` overrides.
     *
     * @param options Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     */
    constructor(options: Partial<GameOptions> = {}) {
        if (ContextManager.isContextStatic()) {
            throw new RegalError(
                "Cannot construct a GameInstance outside of a game cycle."
            );
        }

        this.agents = buildInstanceAgents(this);
        this.events = new InstanceEvents(this);
        this.output = new InstanceOutput(this);
        this.options = new InstanceOptions(this, options);
        this.state = activeAgentProxy(0, this);
    }

    /**
     * Creates a new `GameInstance` for the new game cycle, leaving this object unchanged.
     * **Don't call this unless you know what you're doing.**
     *
     * @param newOptions Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     *
     * @returns The new `GameInstance`, with each manager cycled.
     */
    public recycle(newOptions?: Partial<GameOptions>): GameInstance {
        const opts =
            newOptions === undefined ? this.options.overrides : newOptions;

        const newGame = new GameInstance(opts);
        newGame.events = new InstanceEvents(newGame, this.events.lastEventId);
        newGame.agents = recycleInstanceAgents(this.agents, newGame);
        newGame.output = new InstanceOutput(newGame, this.output.lineCount);

        return newGame;
    }

    /**
     * Activates one or more agents in the current game context. All agents
     * must be activated before they can be used. Activating an agent multiple
     * times has no effect.
     *
     * @param resource Either a single agent, an agent array, or an object
     * where every property is an agent to be activated.
     * @returns Either an activated agent, an agent array, or an object where
     * every property is an activated agent, depending on the structure of `resource`.
     */
    public using<T>(resource: T): T {
        if (isAgent(resource) || resource instanceof Array) {
            return activateAgent(this, resource as any);
        }

        if (resource === undefined) {
            throw new RegalError("Resource must be defined.");
        }

        const returnObj = {} as T;

        for (const key in resource) {
            if (resource.hasOwnProperty(key)) {
                const agent = resource[key];

                if (isAgent(agent)) {
                    returnObj[key] = activateAgent(this, agent);
                } else {
                    throw new RegalError(
                        `Invalid agent in resource at key <${key}>.`
                    );
                }
            }
        }

        return returnObj;
    }
}
