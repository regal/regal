/**
 * Contains mock object that is used in place of references to active agent arrays.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

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
    constructor(public arRefId: number) {}
}
