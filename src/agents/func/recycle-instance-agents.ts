/*
 * Contains the `recycleInstanceAgents` function, which generates
 * a cleaned `InstanceAgents` for a new game cycle.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../../state";
import { AgentReference, isAgentReference } from "../agent-reference";
import { buildInstanceAgents } from "../impl";
import { InstanceAgents } from "../instance-agents";
import { StaticAgentRegistry } from "../static-agent-registry";

/**
 * Creates an `InstanceAgents` for the new game cycle, keeping only
 * the final properties of every agent from before.
 *
 * @param oldAgents The `InstanceAgents` to recycle data from.
 * @param newInstance The new `GameInstance` that will own this `InstanceAgents`.
 */
export const recycleInstanceAgents = (
    oldAgents: InstanceAgents,
    newInstance: GameInstance
): InstanceAgents => {
    const newAgents = buildInstanceAgents(newInstance, oldAgents.nextId);

    for (const formerAgent of oldAgents.agentManagers()) {
        const id = formerAgent.id;
        const am = newAgents.createAgentManager(id);

        const propsToAdd = Object.keys(formerAgent).filter(
            key => key !== "game" && key !== "id"
        );

        // For each updated property on the old agent, add its last value to the new agent.
        propsToAdd.forEach(prop => {
            if (formerAgent.propertyWasDeleted(prop)) {
                if (StaticAgentRegistry.hasAgentProperty(id, prop)) {
                    am.deleteProperty(prop); // Record deletions to static agents.
                }

                return; // If the property was deleted, don't add it to the new record.
            }

            let formerValue = formerAgent.getProperty(prop);

            if (isAgentReference(formerValue)) {
                formerValue = new AgentReference(formerValue.refId);
            }

            am.setProperty(prop, formerValue);
        });
    }

    return newAgents;
};
