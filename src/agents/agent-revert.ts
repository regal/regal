import { noop, on } from "../events";
import { AgentManager } from "./agent-manager";
import { InstanceAgents, propertyIsAgentId } from "./instance-agents";

export const buildRevertFunction = (
    agents: InstanceAgents,
    revertTo: number = 0
) =>
    on("REVERT", game => {
        // TODO
        return noop;
    });
