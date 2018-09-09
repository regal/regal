import { noop, on } from "../events";
import { Agent } from "./agent-model";
import { AgentRecord, PropertyChange } from "./agent-record";
import { InstanceAgents, propertyIsAgentId } from "./instance-agents";
import { StaticAgentRegistry } from "./static-agent";

/**
 * Builds a `TrackedEvent` that reverts all the changes to a given `InstanceAgents` since a specified event.
 *
 * Does not modify the `InstanceAgents` argument.
 *
 * @param agents The agent history on which the revert function will be based.
 * @param revertTo The id of the `TrackedEvent` to which the state will be reverted. Defaults to 0 (the default event id).
 * @returns A `TrackedEvent` that will perform the revert function onto the `GameInstance` on which it's invoked.
 */
export const buildRevertFunction = (
    agents: InstanceAgents,
    revertTo: number = 0
) => {
    const agentIds = Object.keys(agents)
        .filter(propertyIsAgentId)
        .map(idStr => Number.parseInt(idStr, 10));

    return on("REVERT", game => {
        const target = game.agents;

        agentIds.forEach(id => {
            const record = agents[id] as AgentRecord;
            const recordKeys = Object.keys(record);

            // Proxy for all changes
            const agent = new Agent(id, target.game);

            recordKeys
                // Exclude game and id properties
                .filter(key => key !== "game" && key !== "_id")
                .forEach(key => {
                    const changelog: PropertyChange[] = record[key];

                    // Get the changes that happened before the target event
                    const acceptableChanges = changelog.filter(
                        change => change.eventId <= revertTo
                    );

                    if (acceptableChanges.length === 0) {
                        // If all changes to the property happened after the target event, delete/reset it
                        if (StaticAgentRegistry.hasAgentProperty(id, key)) {
                            agent[key] = StaticAgentRegistry.getAgentProperty(
                                id,
                                key
                            );
                        } else {
                            delete agent[key];
                        }
                    } else {
                        // Otherwise, set the property to its value right after the target event
                        const lastAcceptableValue = acceptableChanges[0].final;

                        if (
                            target.getAgentProperty(id, key) !==
                            lastAcceptableValue
                        ) {
                            agent[key] = lastAcceptableValue;
                        }
                    }
                });
        });

        return noop;
    });
};
