/*
 * Contains mock object that is used in place of references to active agent arrays.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { FK } from "../common";
import { AgentId } from "./agent-meta";

/** Whether the given object is an `AgentArrayReference`. */
export const isAgentArrayReference = (o: any): o is AgentArrayReference =>
    o && (o as AgentArrayReference).arRefId !== undefined;

/**
 * Mock object that is used in place of references to active agent arrays.
 */
export class AgentArrayReference {
    /**
     * Constructs a new `AgentReference` in place of an active agent array.
     * @param arRefId The agent array's numeric id.
     */
    constructor(public arRefId: FK<AgentId>) {}
}
