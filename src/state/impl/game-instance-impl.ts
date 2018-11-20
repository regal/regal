/*
 * Contians the current implementation of `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import {
    activateAgent,
    buildActiveAgentProxy,
    buildInstanceAgents,
    InstanceAgentsInternal,
    isAgent
} from "../../agents";
import {
    buildInstanceOptions,
    GameOptions,
    InstanceOptions
} from "../../config";
import { RegalError } from "../../error";
import {
    buildInstanceEvents,
    InstanceEvents,
    recycleInstanceEvents
} from "../../events";
import {
    buildInstanceOutput,
    InstanceOutput,
    recycleInstanceOutput
} from "../../output";
import {
    buildInstanceRandom,
    InstanceRandom,
    recycleInstanceRandom
} from "../../random";
import { ContextManager } from "../context-manager";
import { GameInstance } from "../game-instance";

/**
 * Constructs a new `GameInstance` with optional `GameOption` overrides.
 *
 * @param options Any option overrides preferred for this specific instance.
 * Must be allowed by the static configuration's `allowOverrides` option.
 */
export const buildGameInstance = (
    options: Partial<GameOptions> = {}
): GameInstance => new GameInstanceImpl(options);

class GameInstanceImpl implements GameInstance {
    public agents: InstanceAgentsInternal;
    public events: InstanceEvents;
    public output: InstanceOutput;
    public options: InstanceOptions;
    public random: InstanceRandom;
    public state: any;

    /**
     * Constructs a `GameInstanceImpl`.
     * @param options Option overrides
     * @param generatedSeed Include if the previous GameInstance had a default-generated seed
     */
    constructor(options: Partial<GameOptions>, generatedSeed?: string) {
        if (ContextManager.isContextStatic()) {
            throw new RegalError(
                "Cannot construct a GameInstance outside of a game cycle."
            );
        }

        this.agents = buildInstanceAgents(this);
        this.events = buildInstanceEvents(this);
        this.output = buildInstanceOutput(this);
        this.options = buildInstanceOptions(this, options, generatedSeed);
        this.random = buildInstanceRandom(this);
        this.state = buildActiveAgentProxy(0, this);
    }

    public recycle(newOptions?: Partial<GameOptions>): GameInstance {
        const opts =
            newOptions === undefined ? this.options.overrides : newOptions;

        // Include this instance's seed if it was generated (not specified by the user)
        let genSeed: string;
        if (opts.seed === undefined) {
            genSeed = this.options.seed;
        }

        const newGame = new GameInstanceImpl(opts, genSeed);
        newGame.events = recycleInstanceEvents(this.events, newGame);
        newGame.agents = this.agents.recycle(newGame);
        newGame.output = recycleInstanceOutput(this.output, newGame);
        newGame.random = recycleInstanceRandom(this.random, newGame);

        return newGame;
    }

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
