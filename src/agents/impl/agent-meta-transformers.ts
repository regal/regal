/*
 * Functional transformers for `AgentMeta` objects.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { AgentId, AgentMeta, AgentProtoId } from "../agent-meta";
import { STATIC_AGENT_PK_PROVIDER } from "./agent-keys";
import { getInactiveAgentPK } from "./agent-utils";

/**
 * Utility that builds an `AgentMeta` transformer.
 * @param transformFn Function that returns a new `AgentMeta`, optionally
 * using the previous `AgentMeta`.
 */
const transformMeta = (
    transformFn: (meta?: AgentMeta) => Partial<AgentMeta>
) => (oldMeta: AgentMeta) => ({ ...oldMeta, ...transformFn(oldMeta) });

/** Returns an `AgentMeta` with its default values. */
export const defaultAgentMeta = (): AgentMeta => ({
    id: undefined,
    protoId: undefined
});

/**
 * Returns an `AgentMeta` with its id set to the next static agent PK.
 */
export const staticAgentMeta = transformMeta(() => ({
    id: STATIC_AGENT_PK_PROVIDER.next()
}));

/**
 * Returns an `AgentMeta` with its id set to the reserved inactive agent PK.
 */
export const inactiveAgentMeta = transformMeta(() => ({
    id: getInactiveAgentPK()
}));

/**
 * Returns an `AgentMeta` transformer that transforms an `AgentMeta` id
 * into the given id.
 */
export const agentMetaWithID = (id: AgentId) => transformMeta(() => ({ id }));

/**
 * `AgentMeta` transformer that sets the meta's prototype id to the
 * given `protoId`.
 */
export const agentMetaWithProtoID = (protoId: AgentProtoId) =>
    transformMeta(() => ({ protoId }));
