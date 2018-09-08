import { EventRecord, noop, on } from "../events";
import { Agent } from "./agent-model";
import { AgentRecord } from "./agent-record";
import { InstanceAgents, propertyIsAgentId } from "./instance-agents";

// TODO - test more completely; especially with static agents

export const buildRevertFunction = (agents: InstanceAgents) => {
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
                    const changelog = record[key];
                    if (changelog.length > 1) {
                        const firstValue =
                            changelog[changelog.length - 1].final;
                        agent[key] = firstValue;
                    }
                });
        });

        return noop;
    });
};
