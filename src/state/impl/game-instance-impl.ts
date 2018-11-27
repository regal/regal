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
    isAgent,
    StaticAgentRegistry
} from "../../agents";
import {
    buildInstanceOptions,
    GameOptions,
    InstanceOptionsInternal
} from "../../config";
import { RegalError } from "../../error";
import { buildInstanceEvents, InstanceEventsInternal, on } from "../../events";
import { buildInstanceOutput, InstanceOutputInternal } from "../../output";
import { buildInstanceRandom, InstanceRandomInternal } from "../../random";
import { ContextManager } from "../context-manager";
import { GameInstance } from "../game-instance";
import { GameInstanceInternal } from "../game-instance-internal";

/**
 * Constructs a new `GameInstance` with optional `GameOption` overrides.
 *
 * @param options Any option overrides preferred for this specific instance.
 * Must be allowed by the static configuration's `allowOverrides` option.
 */
export const buildGameInstance = (
    options: Partial<GameOptions> = {}
): GameInstanceInternal => new GameInstanceImpl(options);

class GameInstanceImpl implements GameInstanceInternal {
    public agents: InstanceAgentsInternal;
    public events: InstanceEventsInternal;
    public output: InstanceOutputInternal;
    public options: InstanceOptionsInternal;
    public random: InstanceRandomInternal;
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

    public recycle(newOptions?: Partial<GameOptions>): GameInstanceImpl {
        const opts =
            newOptions === undefined ? this.options.overrides : newOptions;

        // Include this instance's seed if it was generated (not specified by the user)
        let genSeed: string;
        if (opts.seed === undefined) {
            genSeed = this.options.seed;
        }

        const newGame = new GameInstanceImpl(opts, genSeed);
        newGame.events = this.events.recycle(newGame);
        newGame.agents = this.agents.recycle(newGame);
        newGame.output = this.output.recycle(newGame);
        newGame.random = this.random.recycle(newGame);

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

    public simulateRevert(source: GameInstanceInternal, revertTo: number = 0) {
        // Build function to revert agents
        on("REVERT", (game: GameInstanceInternal) => {
            const target = game.agents;

            for (const am of source.agents.agentManagers()) {
                const id = am.id;

                const props = Object.keys(am).filter(
                    key => key !== "game" && key !== "id"
                );

                for (const prop of props) {
                    const history = am.getPropertyHistory(prop);
                    const lastChangeIdx = history.findIndex(
                        change => change.eventId <= revertTo
                    );

                    if (lastChangeIdx === -1) {
                        // If all changes to the property happened after the target event, delete/reset it
                        if (StaticAgentRegistry.hasAgentProperty(id, prop)) {
                            const newVal = StaticAgentRegistry.getAgentProperty(
                                id,
                                prop
                            );
                            target.setAgentProperty(id, prop, newVal);
                        } else {
                            target.deleteAgentProperty(id, prop);
                        }
                    } else {
                        // Otherwise, set the property to its value right after the target event
                        const targetVal = history[lastChangeIdx].final;
                        const currentVal = target.getAgentProperty(id, prop);

                        if (targetVal !== currentVal) {
                            target.setAgentProperty(id, prop, targetVal);
                        }
                    }
                }
            }
        })(this); // Execute the revert function on this instance
    }
}
