/**
 * Contains `buildRevertFunction` for reverting changes made to an
 * `InstanceAgents` during the context of a game cycle.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { noop, on } from "../events";
import { InstanceAgents } from "./instance-agents";
import { StaticAgentRegistry } from "./static-agent-registry";

/**
 * Builds a `TrackedEvent` that reverts all the changes to a given `InstanceAgents` since a specified event.
 *
 * Does not modify the `InstanceAgents` argument.
 *
 * @param agents The agent history on which the revert function will be based.
 * @param revertTo The id of the `TrackedEvent` to which the state will be reverted. Defaults to 0 (the default event id).
 *
 * @returns A `TrackedEvent` that will perform the revert function onto the `GameInstance` on which it's invoked.
 */
export const buildRevertFunction = (
    agents: InstanceAgents,
    revertTo: number = 0
) =>
    on("REVERT", game => {
        const target = game.agents;

        for (const am of agents.agentManagers()) {
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
        return noop;
    });
