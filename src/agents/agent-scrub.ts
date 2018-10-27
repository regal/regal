import { isAgent } from "./agent-model";
import { InstanceAgents, propertyIsAgentId } from "./instance-agents";

export const scrubAgents = (agents: InstanceAgents): void => {
    const seen = new Set<number>();
    const q = [0];

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
