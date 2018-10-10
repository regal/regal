/**
 * Component for controlling tracked game objects called Agents within the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    InstanceAgents,
    buildInstanceAgents,
    recycleInstanceAgents
} from "./instance-agents";
export { Agent, activeAgentProxy } from "./agent-model";
export { StaticAgentRegistry } from "./static-agent-registry";
export { buildRevertFunction } from "./agent-revert";
export { PropertyChange, PropertyOperation } from "./agent-properties";
