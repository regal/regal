/*
 * Contains the function implementation for activating a single agent
 * within the current game context.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";
import { Agent } from "./agent";
import { buildActiveAgentArrayProxy, buildActiveAgentProxy } from "./impl";
import { propertyIsAgentId } from "./instance-agents-internal";

/**
 * Returns an activated agent or agent array within the current game context.
 *
 * Once an agent is activated, its data is managed by the `GameInstance`.
 * An agent cannot be used until it is activated.
 *
 * @param game  The managing `GameInstance`.
 * @param agent The agent to be activated (not modified).
 */
export const activateAgent = <T extends Agent>(
    game: GameInstance,
    agent: T
): T => {
    let id = agent.id;

    if (id === undefined || id < 0) {
        id = game.agents.reserveNewId();
        agent.id = id;
    }

    let activeAgent: T;
    let tempValues = (agent as any).tempValues;

    if (tempValues === undefined) {
        tempValues = {};
    }

    if (agent instanceof Array) {
        tempValues.length = agent.length;
        Object.keys(agent)
            .filter(propertyIsAgentId)
            .forEach(key => (tempValues[key] = agent[key]));

        activeAgent = buildActiveAgentArrayProxy(id, game) as T;
    } else {
        activeAgent = buildActiveAgentProxy(id, game) as T;
    }

    for (const prop of Object.keys(tempValues)) {
        activeAgent[prop] = tempValues[prop];
    }

    return activeAgent;
};
