import { FK } from "../common";
import { Agent } from "./agent";

/*
 * Contains mock object that is used in place of active agent circular references.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/** Whether the given object is an `AgentReference`. */
export const isAgentReference = (o: any): o is AgentReference =>
    o && (o as AgentReference).refId !== undefined;

/**
 * Mock object that is used in place of active agent circular references.
 */
export class AgentReference {
    /**
     * Constructs a new `AgentReference` in place of an active agent.
     * @param refId The mocked agent's numeric id.
     */
    constructor(public refId: FK<Agent>) {}
}
