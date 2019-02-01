/*
 * The purpose of this file is to abstract all agent-related implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    buildActiveAgentProxy,
    buildActiveAgentArrayProxy
} from "./active-agent-proxy";
export { buildInstanceAgents } from "./instance-agents-impl";
export { buildAgentManager } from "./agent-manager-impl";
export { buildInactiveAgentProxy } from "./inactive-agent-proxy";
export { activateAgent } from "./activate-agent";
