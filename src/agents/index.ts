/**
 * Component for controlling tracked game objects called Agents within the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceAgents } from "./instance-agents";
export { Agent, isAgent } from "./agent-model";
export { StaticAgentRegistry } from "./static-agent-registry";
export { buildRevertFunction } from "./func/agent-revert";
export { PropertyChange, PropertyOperation } from "./agent-properties";
export { activateAgent } from "./func/activate-agent";
export { scrubAgents } from "./func/agent-scrub";
export { buildInstanceAgents } from "./impl/instance-agents-impl";
export { recycleInstanceAgents } from "./func/recycle-instance-agents";
export { activeAgentProxy } from "./impl/active-agent-proxy";
