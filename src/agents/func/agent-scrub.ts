/*
 * Contains `scrubAgents` function, which deletes all agents in an
 * `InstanceAgents` that are not accessible from the instance's state.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { isAgent } from "../agent";
import { InstanceAgents, propertyIsAgentId } from "../instance-agents";

/**
 * Traverses all agents that are accessible from the `GameInstance`'s
 * state via breadth-first search. All remaining agents (the ones with
 * no references to them) are deleted from the `InstanceAgents`.
 *
 * If run at the improper time, this will break event sourcing and/or
 * instance reverting. Make sure to use this correctly.
 *
 * @param agents The `InstanceAgents` to be scrubbed.
 */
export const scrubAgents = (agents: InstanceAgents): void => {
    const seen = new Set<number>();
    const q = [0]; // Start at the state, which always has an id of zero

    while (q.length > 0) {
        const id = q.shift();
        seen.add(id);

        for (const prop of agents.getAgentPropertyKeys(id)) {
            const val = agents.getAgentProperty(id, prop);
            if (isAgent(val) && !seen.has(val.id)) {
                q.push(val.id);
            }
        }
    }

    const waste = Object.keys(agents)
        .filter(propertyIsAgentId)
        .filter(id => !seen.has(Number(id)));

    for (const id of waste) {
        delete agents[id];
    }
};
