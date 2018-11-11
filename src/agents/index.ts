/**
 * Component for controlling tracked game objects (called Agents) within the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceAgents } from "./instance-agents";
export { Agent, isAgent } from "./agent";
export { StaticAgentRegistry } from "./static-agent-registry";
export { PropertyChange, PropertyOperation } from "./agent-properties";
export { activateAgent } from "./func/activate-agent";
export { scrubAgents } from "./func/agent-scrub";
export { recycleInstanceAgents } from "./func/recycle-instance-agents";
export { buildActiveAgentProxy, buildInstanceAgents } from "./impl";
export { buildRevertFunction } from "./func/agent-revert";
