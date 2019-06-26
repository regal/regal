/*
 * Component for controlling tracked game objects (called Agents) within the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceAgentsInternal } from "./instance-agents-internal";
export { Agent, isAgent } from "./agent";
export { StaticAgentRegistry } from "./static-agent-registry";
export { PropertyChange, PropertyOperation } from "./agent-properties";
export {
    buildActiveAgentProxy,
    buildInstanceAgents,
    activateAgent,
    gameInstancePK
} from "./impl";
