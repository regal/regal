/*
 * Contains the `Agent` prototype primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";

export const AGENT_PROTO_RESERVED_KEYS = {
    INSTANCE_STATE: 100
};

export const buildAgentProtoPKProvider = () =>
    buildPKProvider<AgentProtoId>(AGENT_PROTO_RESERVED_KEYS);

export const STATIC_PROTO_PK_PROVIDER = buildAgentProtoPKProvider();

export const getInstanceStateAgentProtoPK = () =>
    STATIC_PROTO_PK_PROVIDER.reserved(AGENT_PROTO_RESERVED_KEYS.INSTANCE_STATE);
