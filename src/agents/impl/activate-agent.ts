/*
 * Contains the function implementation for activating a single agent
 * within the current game context.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { Mutable } from "../../common";
import { GameInstanceInternal } from "../../state";
import { Agent } from "../agent";
import { propertyIsAgentId } from "../instance-agents-internal";
import {
    buildActiveAgentArrayProxy,
    buildActiveAgentProxy
} from "./active-agent-proxy";
import { isAgentActive } from "./agent-utils";

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
    game: GameInstanceInternal,
    agent: T
): T => {
    let id = agent.id;

    if (id === undefined || !isAgentActive(id)) {
        id = game.agents.reserveNewId();
        (agent as Mutable<Agent>).id = id;
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
