/*
 * Component for controlling tracked game objects (called Agents) within the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceAgentsInternal } from "./instance-agents-internal";
export { Agent, isAgent } from "./agent";
export { StaticAgentRegistry } from "./static-agent-registry";
export { PropertyChange, PropertyOperation } from "./agent-properties";
export { activateAgent } from "./activate-agent";
export { buildActiveAgentProxy, buildInstanceAgents } from "./impl";
