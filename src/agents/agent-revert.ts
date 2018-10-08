import { noop, on } from "../events";
import { InstanceAgents } from "./instance-agents";
import { StaticAgentRegistry } from "./static-agent-registry";

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
