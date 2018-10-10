/**
 * Contains the function implementation for activating a single agent
 * within the current game context.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import GameInstance from "../game-instance";
import { activeAgentProxy, Agent } from "./agent-model";

/**
 * Returns an activated agent within the current game context.
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

    if (id < 0) {
        id = game.agents.reserveNewId();
        agent.id = id;
    }

    const activeAgent = activeAgentProxy(id, game) as T;

    const tempValues = (agent as any).tempValues;

    if (tempValues !== undefined) {
        for (const prop of Object.keys(tempValues)) {
            activeAgent[prop] = tempValues[prop];
        }
    }

    return activeAgent;
};
