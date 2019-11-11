/*
 * Contains the `Agent` prototype primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";

/** The set of reserved `Agent` prototype keys. */
export const AGENT_PROTO_RESERVED_KEYS = {
    /**
     * The reserved proto key for `GameInstance.state`, which has
     * no customizable prototype.
     */
    INSTANCE_STATE: 100
};

/** Helper function to build the `AgenProtoId` PK provider. */
export const buildAgentProtoPKProvider = () =>
    buildPKProvider<AgentProtoId>(AGENT_PROTO_RESERVED_KEYS);

/** The `Agent` prototype PK provider for static agents. */
export const STATIC_PROTO_PK_PROVIDER = buildAgentProtoPKProvider();

/** Shorthand for the `AGENT_PROTO_RESERVED_KEYS.INSTANCE_STATE` PK. */
export const getInstanceStateAgentProtoPK = () =>
    STATIC_PROTO_PK_PROVIDER.reserved(AGENT_PROTO_RESERVED_KEYS.INSTANCE_STATE);
