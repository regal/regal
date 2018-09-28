import { Agent } from "./agent-model";

export const isContextStatic = () => {
    return true;
};

export const getNextStaticAgentId = () => {
    return 1;
};

export const addAgentToStaticRegistry = (agent: Agent) => {
    return;
};

export const getStaticAgentProperty = (
    id: number,
    property: PropertyKey
): any => {
    return;
};
