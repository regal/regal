import { GameInstance } from "./game";
import { Event } from "./event";
export declare class StaticAgentRegistry {
    agentCount: number;
    addAgent<T extends Agent>(agent: T): T;
    getAgentProperty(agentId: number, propertyKey: PropertyKey): any;
    hasAgent(agentId: number): boolean;
    hasAgentProperty(agentId: number, propertyKey: PropertyKey): boolean;
}
export declare let staticAgentRegistry: StaticAgentRegistry;
export declare const resetRegistry: () => void;
export declare class Agent {
    private _id?;
    game?: GameInstance;
    constructor(_id?: number, game?: GameInstance);
    readonly isRegistered: boolean;
    readonly isStatic: boolean;
    id: number;
    register(game: GameInstance, newId?: number): this;
    static(): this;
}
export declare class AgentReference {
    refId: number;
    constructor(refId: number);
}
export declare class InstanceAgents {
    game: GameInstance;
    constructor(game: GameInstance);
    getNextAgentId(): number;
    addAgent(agent: Agent, event: Event): void;
    getAgentProperty(agentId: number, property: PropertyKey): any;
    setAgentProperty(agentId: number, property: PropertyKey, value: any, event: Event): boolean;
    hasAgentProperty(agentId: number, property: PropertyKey): boolean;
}
export declare enum PropertyOperation {
    ADDED = "ADDED",
    MODIFIED = "MODIFIED",
    DELETED = "DELETED"
}
export interface PropertyChange {
    eventId?: number;
    eventName?: string;
    agentId?: number;
    op: PropertyOperation;
    init?: any;
    final?: any;
    property?: string;
}
export declare class AgentRecord {
    getProperty(propertyKey: PropertyKey): any;
    setProperty<T>(event: Event, property: PropertyKey, value: T): void;
    private _addRecord;
}
export declare class InstanceState extends Agent {
    constructor(game: GameInstance);
}
