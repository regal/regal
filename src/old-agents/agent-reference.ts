/**
 * Contains mock object that is used in place of  registered agent circular references.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

/** Whether the given object is an `AgentReference`. */
export const isAgentReference = (o: any): o is AgentReference =>
    o && (o as AgentReference).refId !== undefined;

/**
 * Mock object that is used in place of registered agent circular references.
 */
export class AgentReference {
    /**
     * Constructs a new `AgentReference` in place of a registered agent.
     * @param refId The mocked agent's numeric id.
     */
    constructor(public refId: number) {}
}