import { EventRecord, noop, on } from "../events";
import { Agent } from "./agent-model";
import { AgentRecord, PropertyChange } from "./agent-record";
import { InstanceAgents, propertyIsAgentId } from "./instance-agents";

// TODO - test more completely; especially with static agents

/**
 * Builds a `TrackedEvent` that reverts all the changes to a given `InstanceAgents` since a specified event.
 *
 * Does not modify the `InstanceAgents` argument.
 *
 * @param agents The agent history on which the revert function will be based.
 * @param revertTo The id of the `TrackedEvent` to which the state will be reverted.
 * @returns A `TrackedEvent` that will perform the revert function onto the `GameInstance` on which it's invoked.
 */
export const buildRevertFunction = (
    agents: InstanceAgents,
    revertTo: number = 0
) => {
    const agentKeys = Object.keys(agents).filter(propertyIsAgentId);
    const agentRecords = agentKeys.map(key => agents[key] as AgentRecord);

    return on("REVERT", game => {
        const target = game.agents;

        agentRecords.forEach(record => {
            const recordKeys = Object.keys(record);
            const id = record.getProperty("_id");

            const agent = new Agent(id, target.game);

            recordKeys
                .filter(key => key !== "game" && key !== "_id")
                .forEach(key => {
                    const changelog: PropertyChange[] = record[key];
                    const lastAcceptableChangeIndex = changelog.findIndex(
                        pc => pc.eventId === revertTo
                    );

                    if (lastAcceptableChangeIndex !== -1) {
                        const lastAcceptableValue =
                            changelog[lastAcceptableChangeIndex].final;

                        if (
                            target.getAgentProperty(id, key) !==
                            lastAcceptableValue
                        ) {
                            agent[key] = lastAcceptableValue;
                        }
                    }

                    // if (changelog.length > 1) {
                    //     const firstValue =
                    //         changelog[changelog.length - 1].final;
                    //     agent[key] = firstValue;
                    // }
                });
        });

        return noop;
    });
};
