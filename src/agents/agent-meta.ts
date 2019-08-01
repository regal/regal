/*
 * Contains metadata associated with agents.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../common";
import { Agent } from "./agent";

export type AgentId = PK<Agent>;
export type AgentProtoId = PK<"AgentProto">;

/**
 * A special object associated with every agent which contains
 * important metadata related to that agent. Properties in `AgentMeta`
 * are not tracked like all other agent properties.
 */
export interface AgentMeta {
    /** The agent's unique identifier in the context of the current game. */
    id: AgentId;
    /** The unique identifier for the agent's prototype. */
    protoId: AgentProtoId;
}

/** Constants for reserved Agent properties. */
export enum ReservedAgentProperty {
    /** `Agent.meta` */
    META = "meta",
    /** `AgentManager.game` */
    GAME = "game",
    /** Used by `InactiveAgentProxy` */
    TEMP_VALUES = "tempValues"
}
