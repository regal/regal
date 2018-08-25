import { EventRecord } from "./event";
import { RegalError } from "./error";
import GameInstance from "./game-instance";

const StaticAgentProxyHandler = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = Reflect.get(target, propertyKey);

        if (
            value === undefined 
            && (target.game === undefined || !target.game.agents.agentPropertyWasDeleted(target.id, propertyKey))
        ) {
            value = staticAgentRegistry.getAgentProperty(target.id, propertyKey);
        }

        return value;
    },

    has(target: Agent, propertyKey: PropertyKey) {
        if (target.game !== undefined && target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)) {
            return false;
        }
        return staticAgentRegistry.hasAgentProperty(target.id, propertyKey);
    }
};

export class StaticAgentRegistry {

    agentCount = 0

    addAgent<T extends Agent>(agent: T): T {
        if (agent.isRegistered) {
            throw new RegalError("Cannot create a static version of a registered agent.");
        }
        if (agent.isStatic) {
            throw new RegalError("Cannot create more than one static version of an agent.");
        }

        const id = ++this.agentCount;
        agent.id = id;
        this[id] = agent;

        return new Proxy(new Agent(agent.id), StaticAgentProxyHandler) as T;
    }

    getAgentProperty(agentId: number, propertyKey: PropertyKey): any {
        if (!this.hasOwnProperty(agentId)) {
            throw new RegalError(`No static agent with ID <${agentId}> exists in the registry.`)
        }

        return this[agentId][propertyKey];
    }

    hasAgent(agentId: number): boolean {
        return this.hasOwnProperty(agentId);
    }

    hasAgentProperty(agentId: number, propertyKey: PropertyKey): boolean {
        return this.hasAgent(agentId) && this[agentId].hasOwnProperty(propertyKey);
    }
}

export let staticAgentRegistry = new StaticAgentRegistry();

export const resetRegistry = () => {
    staticAgentRegistry = new StaticAgentRegistry();
};

export const isAgent = (o: any): o is Agent =>
    o && (<Agent>o).isRegistered !== undefined;

const AgentProxyHandler = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object): any {
        let value: any = undefined;

        // If the property exists in the instance state, return it.
        if (target.isRegistered && target.game.agents.hasAgentProperty(target.id, propertyKey)) {
            value = target.game.agents.getAgentProperty(target.id, propertyKey);
        } 
        // If the property never existed in the instance state (i.e. wasn't deleted), return the Reflect.get.
        else if (target.game === undefined || !target.game.agents.agentPropertyWasDeleted(target.id, propertyKey)) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    set(target: Agent, propertyKey: PropertyKey, value: any, receiver: object): boolean {
        let result: boolean = undefined;

        if (target.isRegistered) {
            const currentEvent = target.game.events.current;
            result = target.game.agents.setAgentProperty(target.id, propertyKey, value, currentEvent);
        } else {
            result = Reflect.set(target, propertyKey, value, receiver);
        }
        
        return result;
    },

    has(target: Agent, propertyKey: PropertyKey): boolean {
        return target.isRegistered 
            ? target.game.agents.hasAgentProperty(target.id, propertyKey) 
            : Reflect.has(target, propertyKey);
    },

    deleteProperty(target: Agent, propertyKey: PropertyKey): boolean {
        let result: boolean = undefined;

        if (target.isRegistered && target.game.agents.hasAgentProperty(target.id, propertyKey)) {
            const currentEvent = target.game.events.current;
            result = target.game.agents.deleteAgentProperty(target.id, propertyKey, currentEvent);
        } else {
            result = Reflect.deleteProperty(target, propertyKey);
        }

        return result;
    }
};

export class Agent {

    constructor(private _id?: number, public game?: GameInstance) {
        return new Proxy(this, AgentProxyHandler);
    }

    get isRegistered(): boolean {
        return this.game !== undefined && this.game.agents.hasAgent(this.id);
    }

    get isStatic(): boolean {
        return this._id !== undefined && staticAgentRegistry.hasAgent(this._id);
    }

    get id() {
        return this._id;
    }

    set id(value: number) {
        if (this._id !== undefined) {
            throw new RegalError("Cannot change an agent's ID once it has been set.");
        }
        this._id = value;
    }

    register(game: GameInstance, newId?: number): this {
        if (!game) {
            throw new RegalError("The GameInstance must be defined to register the agent.");
        }
        if (this.isRegistered) {
            throw new RegalError("Cannot register an agent more than once.");
        }

        if (newId !== undefined) {
            if (newId < 0) {
                throw new RegalError("newId must be positive.");
            }
            if (staticAgentRegistry.hasAgent(newId)) {
                throw new RegalError(`A static agent already has the ID <${newId}>.`);
            }

            this.id = newId;
        } else if (!this.isStatic) {
            this.id = game.agents.getNextAgentId();
        }
        
        this.game = game;
        
        const currentEvent = game.events.current;
        game.agents.addAgent(this, currentEvent);

        return this;
    }

    static(): this {
        return staticAgentRegistry.addAgent(this);
    }
}

const isAgentReference = (o: any): o is AgentReference =>
    o && (<AgentReference>o).refId !== undefined;

export class AgentReference {
    constructor(public refId: number) {}
}

export class InstanceAgents {

    constructor(public game: GameInstance) {}

    getNextAgentId(): number {
        let i = staticAgentRegistry.agentCount + 1;
        while (this.hasOwnProperty(i)) {
            i++;
        }
        return i;
    }

    addAgent(agent: Agent, event: EventRecord): void {
        if (this.hasOwnProperty(agent.id)) {
            throw new RegalError(`An agent with ID <${agent.id}> has already been registered with the instance.`);
        }

        if (!agent.isStatic) {
            this[agent.id] = new AgentRecord();

            for (let key in agent) {
                this.setAgentProperty(agent.id, key, agent[key], event);
            }
        }
    }

    hasAgent(agentId: number): boolean {
        return this.hasOwnProperty(agentId) || staticAgentRegistry.hasAgent(agentId);
    }

    getAgentProperty(agentId: number, property: PropertyKey): any {
        const agentRecord: AgentRecord = this[agentId];
        let value;

        if (agentRecord === undefined) {
            if (staticAgentRegistry.hasAgent(agentId)) {
                value = staticAgentRegistry.getAgentProperty(agentId, property);
            } else {
                throw new RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
            }
        } else {
            value = agentRecord.getProperty(property);
        }

        if (isAgentReference(value)) {
            const psuedoAgent = new Agent(value.refId, this.game);
            value = new Proxy(psuedoAgent, AgentProxyHandler);
        }

        return value;
    }

    // TODO: Register agents within arrays
    setAgentProperty(agentId: number, property: PropertyKey, value: any, event: EventRecord): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (staticAgentRegistry.hasAgent(agentId)) {
                this[agentId] = new AgentRecord();
            } else {
                throw new RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
            }
        }

        const agentRecord: AgentRecord = this[agentId];

        if (isAgent(value)) {
            if (!value.isRegistered) {
                const game: GameInstance = this.getAgentProperty(agentId, "game");
                value = value.register(game);
            }

            value = new AgentReference(value.id);
        }

        agentRecord.setProperty(event, agentId, property, value);

        return true;
    }

    hasAgentProperty(agentId: number, property: PropertyKey): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (staticAgentRegistry.hasAgent(agentId)) {
                return staticAgentRegistry.hasAgentProperty(agentId, property);
            }
            throw new RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
        }

        const agentRecord: AgentRecord = this[agentId];
        return agentRecord.hasOwnProperty(property) && !agentRecord.propertyWasDeleted(property);
    }

    deleteAgentProperty(agentId: number, property: PropertyKey, event: EventRecord): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (staticAgentRegistry.hasAgent(agentId)) {
                if (staticAgentRegistry.hasAgentProperty(agentId, property)) {
                    this[agentId] = new AgentRecord();
                } else {
                    // If the static agent doesn't exist in the instance state, but that agent doesn't
                    // have the property that someone is attempting to delete, we don't do anything.
                    return false; 
                }
            } else {
                throw new RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
            }
        }

        const agentRecord: AgentRecord = this[agentId];

        return agentRecord.deleteProperty(event, agentId, property);
    }

    agentPropertyWasDeleted(agentId: number, property: PropertyKey): boolean {
        return this.hasOwnProperty(agentId) && (<AgentRecord>this[agentId]).propertyWasDeleted(property);
    }
}

export enum PropertyOperation {
    ADDED = "ADDED",
    MODIFIED = "MODIFIED",
    DELETED = "DELETED"
}

export interface PropertyChange {
    eventId?: number,
    eventName?: string,
    agentId?: number,
    op: PropertyOperation,
    init?: any,
    final?: any,
    property?: string
}

export class AgentRecord {
    
    getProperty(propertyKey: PropertyKey): any {
        const changes: PropertyChange[] = this[propertyKey];
        let property: any = undefined;

        if (changes !== undefined && changes.length > 0) {
            property = changes[0].final;
        }

        return property;
    }

    setProperty<T>(event: EventRecord, agentId: number, property: PropertyKey, value: T): void {
        let initValue = this.getProperty(property);

        if (initValue === undefined && staticAgentRegistry.hasAgentProperty(agentId, property)) {
            initValue = staticAgentRegistry.getAgentProperty(agentId, property);
        }

        const op = initValue === undefined ? PropertyOperation.ADDED : PropertyOperation.MODIFIED;

        this._addRecord(event, property, op, initValue, value);
        event.trackChange(agentId, property, op, initValue, value);
    }

    deleteProperty(event: EventRecord, agentId: number, property: PropertyKey): boolean {
        let initValue = this.getProperty(property);

        if (!this.hasOwnProperty(property)) {
            if (staticAgentRegistry.hasAgentProperty(agentId, property)) {
                initValue = staticAgentRegistry.getAgentProperty(agentId, property);
            } else {
                return false;
            }
        }

        this._addRecord(event, property, PropertyOperation.DELETED, initValue);
        event.trackChange(agentId, property, PropertyOperation.DELETED, initValue);

        return true;
    }

    propertyWasDeleted(propertyKey: PropertyKey): boolean {
        if (this.hasOwnProperty(propertyKey)) {
            const lastChange: PropertyChange = this[propertyKey][0];

            if (lastChange.op === PropertyOperation.DELETED) {
                return true;
            }
        }

        return false;
    }

    private _addRecord<T>(event: EventRecord, property: PropertyKey, op: PropertyOperation, init?: T, final?: T): void {
        if (!(property in this)) {
            this[property] = new Array<PropertyChange>();
        }

        const change: PropertyChange = {
            eventId: event.id,
            eventName: event.name,
            op,
            init,
            final
        };

        (<PropertyChange[]>this[property]).unshift(change);
    }
}

export class InstanceState extends Agent {

    constructor(game: GameInstance) {
        super();
        return this.register(game, 0);
    }
}
