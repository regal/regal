/*
 * Contians the current implementation of `GameInstance`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import {
    activateAgent,
    buildActiveAgentProxy,
    buildInstanceAgents,
    gameInstancePK,
    InstanceAgentsInternal,
    isAgent,
    StaticAgentRegistry
} from "../../agents";
import { isAgentArrayReference } from "../../agents/agent-array-reference";
import { isAgentReference } from "../../agents/agent-reference";
import {
    buildInstanceOptions,
    GameOptions,
    InstanceOptionsInternal
} from "../../config";
import { RegalError } from "../../error";
import {
    buildInstanceEvents,
    InstanceEventsInternal,
    on,
    TrackedEvent
} from "../../events";
import { buildInstanceOutput, InstanceOutputInternal } from "../../output";
import { buildInstanceRandom, InstanceRandomInternal } from "../../random";
import { ContextManager } from "../context-manager";
import { GameInstanceInternal } from "../game-instance-internal";

/**
 * Constructs a new `GameInstance` with optional `GameOption` overrides.
 *
 * @template StateType The state property's type. Optional, defaults to `any`.
 * @param optOverrides Any option overrides preferred for this specific instance.
 * Must be allowed by the static configuration's `allowOverrides` option.
 */
export const buildGameInstance = <StateType = any>(
    optOverrides?: Partial<GameOptions>
): GameInstanceInternal<StateType> => {
    if (optOverrides !== undefined) {
        return new GameInstanceImpl<StateType>({
            optionsBuilder: game => buildInstanceOptions(game, optOverrides)
        });
    }
    return new GameInstanceImpl<StateType>();
};

/**
 * Internal interface to aid with constructing a `GameInstanceImpl`.
 * Each property provides a constructor for each of the `InstanceX` components.
 */
interface GameInstanceCtor {
    agentsBuilder: (game: GameInstanceInternal) => InstanceAgentsInternal;
    eventsBuilder: (game: GameInstanceInternal) => InstanceEventsInternal;
    outputBuilder: (game: GameInstanceInternal) => InstanceOutputInternal;
    optionsBuilder: (game: GameInstanceInternal) => InstanceOptionsInternal;
    randomBuilder: (game: GameInstanceInternal) => InstanceRandomInternal;
}

/**
 * Implementation of `GameInstanceInternal`.
 * @template StateType The state property's type. Optional, defaults to `any`.
 */
class GameInstanceImpl<StateType = any>
    implements GameInstanceInternal<StateType> {
    public agents: InstanceAgentsInternal;
    public events: InstanceEventsInternal;
    public output: InstanceOutputInternal;
    public options: InstanceOptionsInternal;
    public random: InstanceRandomInternal;
    public state: StateType;

    /**
     * Constructs a `GameInstanceImpl` with the given `InstanceX` constructor functions.
     */
    constructor({
        agentsBuilder = buildInstanceAgents,
        eventsBuilder = buildInstanceEvents,
        outputBuilder = buildInstanceOutput,
        optionsBuilder = buildInstanceOptions,
        randomBuilder = buildInstanceRandom
    }: Partial<GameInstanceCtor> = {}) {
        if (ContextManager.isContextStatic()) {
            throw new RegalError(
                "Cannot construct a GameInstance outside of a game cycle."
            );
        }

        this.options = optionsBuilder(this);
        this.events = eventsBuilder(this);
        this.agents = agentsBuilder(this);
        this.output = outputBuilder(this);
        this.random = randomBuilder(this);
        this.state = (buildActiveAgentProxy(
            gameInstancePK(),
            this
        ) as unknown) as StateType;
    }

    public recycle(newOptions?: Partial<GameOptions>): GameInstanceImpl {
        return new GameInstanceImpl(this._buildRecycleCtor(newOptions));
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

    public revert(revertTo: number = 0): GameInstanceImpl {
        if (revertTo !== 0) {
            if (revertTo < 0) {
                throw new RegalError("revertTo must be zero or greater.");
            }
            if (!this.options.trackAgentChanges) {
                throw new RegalError(
                    "In order to revert to an intermediate event ID, GameOptions.trackAgentChanges must be true."
                );
            }
        }

        const ctor = this._buildRecycleCtor();
        ctor.randomBuilder = this._buildRandomRevertCtor(revertTo); // Revert random value stream

        const newInstance = new GameInstanceImpl(ctor);
        this._buildAgentRevertFunc(revertTo)(newInstance); // Revert agent changes

        return newInstance;
    }

    /** Internal helper that builds the `InstanceX` constructors for recycling. */
    private _buildRecycleCtor(
        newOptions?: Partial<GameOptions>
    ): GameInstanceCtor {
        const opts =
            newOptions === undefined ? this.options.overrides : newOptions;

        // Include this instance's seed if it was generated (not specified by the user)
        let genSeed: string;
        if (opts.seed === undefined) {
            genSeed = this.options.seed;
        }

        return {
            agentsBuilder: game => this.agents.recycle(game),
            eventsBuilder: game => this.events.recycle(game),
            optionsBuilder: game => buildInstanceOptions(game, opts, genSeed),
            outputBuilder: game => this.output.recycle(game),
            randomBuilder: game => this.random.recycle(game)
        };
    }

    /**
     * Internal helper that builds an `InstanceRandom` constructor with its `numGenerations`
     * set to the appropriate revert event.
     */
    private _buildRandomRevertCtor(revertTo: number) {
        return (game: GameInstanceImpl) => {
            let numGens: number = this.random.numGenerations;

            const eventsWithRandoms = this.events.history.filter(
                er => er.randoms !== undefined && er.randoms.length > 0
            );

            if (eventsWithRandoms.length > 0) {
                const lastEvent = eventsWithRandoms.find(
                    er => er.id <= revertTo
                );

                if (lastEvent === undefined) {
                    // All random values were generated after the target event
                    numGens =
                        eventsWithRandoms[eventsWithRandoms.length - 1]
                            .randoms[0].id;
                } else {
                    // Otherwise, set num generations to its value AFTER (+1) the target event
                    const lastRandoms = lastEvent.randoms;
                    numGens = lastRandoms[lastRandoms.length - 1].id + 1;
                }
            }
            return buildInstanceRandom(game, numGens);
        };
    }

    /** Internal helper that builds a `TrackedEvent` to revert agent changes */
    private _buildAgentRevertFunc(revertTo: number): TrackedEvent {
        return on("REVERT", (game: GameInstanceInternal) => {
            const target = game.agents;

            for (const am of this.agents.agentManagers()) {
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
                            const areEqAgents =
                                isAgentReference(targetVal) &&
                                isAgent(currentVal) &&
                                targetVal.refId === currentVal.id;

                            const areEqAgentArrs =
                                isAgentArrayReference(targetVal) &&
                                isAgent(currentVal) &&
                                targetVal.arRefId === currentVal.id;

                            if (!areEqAgents && !areEqAgentArrs) {
                                target.setAgentProperty(id, prop, targetVal);
                            }
                        }
                    }
                }
            }
        });
    }
}
