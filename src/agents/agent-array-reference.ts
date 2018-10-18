export const isAgentArrayReference = (o: any): o is AgentArrayReference =>
    o && (o as AgentArrayReference).arRefId !== undefined;

export class AgentArrayReference {
    constructor(public arRefId: number) {}
}
