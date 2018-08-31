export const isAgentReference = (o: any): o is AgentReference =>
    o && (o as AgentReference).refId !== undefined;

export class AgentReference {
    constructor(public refId: number) {}
}
