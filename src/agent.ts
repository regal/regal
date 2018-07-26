import { GameInstance, RegalError, Game } from "./game";
import { Event, on } from "./event";
import { inspect } from 'util'; // TODO: Remove

const log = (o: any, title?: string) => console.log(`${(title) ? `${title}: ` : ''}${inspect(o, {depth: Infinity})}`); // TODO: Remove

const StaticAgentProxyHandler = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = Reflect.get(target, propertyKey);

        if (value === undefined) {
            value = staticAgentRegistry.getAgentProperty(target.id, propertyKey);
        }

        return value;
    },

    set(target: Agent, propertyKey: PropertyKey, value: any, receiver: object) {
        return Reflect.set(target, propertyKey, value, receiver);
    },

    has(target: Agent, propertyKey: PropertyKey) {
        return staticAgentRegistry.hasAgentProperty(target.id, propertyKey);
    }
}

export class StaticAgentRegistry {

    agentCount = 0

    addAgent<T extends Agent>(agent: T): T {
        if (agent.isRegistered) {
            throw new RegalError("Cannot create a static version of an agent that has already been registered.");
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

function isAgent(o: any): o is Agent {
    return (<Agent>o).isRegistered !== undefined;
}

const AgentProxyHandler = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = undefined;

        if (propertyKey in receiver) {
            value = target.game.agents.getAgentProperty(target.id, propertyKey);
        }

        if (value === undefined) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    set(target: Agent, propertyKey: PropertyKey, value: any, receiver: object) {
        const currentEvent = target.game.events.getCurrentEvent();
        return target.game.agents.setAgentProperty(target.id, propertyKey, value, currentEvent);
    },

    has(target: Agent, propertyKey: PropertyKey) {
        return target.game.agents.hasAgentProperty(target.id, propertyKey);
    }
}

export class Agent {

    constructor(private _id?: number, public game?: GameInstance) {}

    get isRegistered(): boolean {
        return this.game !== undefined;
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

        this.game = game;

        if (newId !== undefined) {
            this.id = newId;
        } else if (!this.isStatic) {
            this.id = game.agents.getNextAgentId();
        }
        
        const currentEvent = game.events.getCurrentEvent();
        game.agents.addAgent(this, currentEvent);

        return new Proxy(this, AgentProxyHandler) as this;
    }

    static(): this {
        return staticAgentRegistry.addAgent(this);
    }
}

function isAgentReference(o: any): o is AgentReference {
    return (<AgentReference>o).refId !== undefined;
}

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

    addAgent(agent: Agent, event: Event): void {
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
            if (property in agentRecord) {
                value = agentRecord.getProperty(property);
            } else if (staticAgentRegistry.hasAgentProperty(agentId, property)) {
                value = staticAgentRegistry.getAgentProperty(agentId, property);
            } else {
                value = undefined;
            }
        }

        if (isAgentReference(value)) {
            const psuedoAgent = new Agent(value.refId, this.game);
            value = new Proxy(psuedoAgent, AgentProxyHandler);
        }

        return value;
    }

    // TODO: Register agents within arrays
    setAgentProperty(agentId: number, property: PropertyKey, value: any, event: Event): boolean {
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

        agentRecord.setProperty(event, property, value);

        return true;
    }

    hasAgentProperty(agentId: number, property: PropertyKey): boolean {
        if (!this.hasOwnProperty(agentId)) {
            if (staticAgentRegistry.hasAgent(agentId)) {
                return staticAgentRegistry.hasAgentProperty(agentId, property);
            }
            throw new RegalError(`No agent with ID <${agentId}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agentId];
        return agentRecord.hasOwnProperty(property);
    }
}

export enum PropertyOperation {
    ADDED = "ADDED",
    MODIFIED = "MODIFIED",
    DELETED = "DELETED" // TODO: support
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

        if (changes !== undefined && changes.length > 0) {
            return changes[0].final;
        }

        return undefined;
    }

    setProperty<T>(event: Event, property: PropertyKey, value: T): void {
        if (!this.hasOwnProperty(property)) {
            this._addRecord(event, property, PropertyOperation.ADDED, undefined, value);
        } else {
            const initValue = this.getProperty(property);
            this._addRecord(event, property, PropertyOperation.MODIFIED, initValue, value);
        }
    }

    private _addRecord<T>(event: Event, property: PropertyKey, op: PropertyOperation, init?: T, final?: T): void {
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

// ** Test Code ** //

// class Dummy extends Agent {
//     constructor(public name: string, public health: number) {
//         super();
//     }
// }

// const staticDummy = new Dummy("Static Boi", 15).static();
// log(staticDummy, "Static Dummy");
// log(staticAgentRegistry, "Static Agent Registry");

// const add = (dummy: Dummy) => on("ADD", game => {
//     game.state.nonstatic = dummy;
//     game.output.push(game.state.nonstatic.name);
//     return game;
// });

// const init = on("INIT", game => {
//     game.state.static = staticDummy;
//     game.output.push(game.state.static.name);

//     const fluid = new Dummy("Fluid Man", 29).register(game);
//     add(fluid)(game);

//     fluid["staticy"] = staticDummy;
//     game.state.static.fluidy = fluid;

//     game.state.static.fluidy.name = "OH HECK THIS WORKS";

//     return game;
// });

// const myGame = init(new GameInstance());
// log(myGame);
// log(staticAgentRegistry, "Static Agent Registry");
