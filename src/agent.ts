import { GameInstance, RegalError } from "./game";
import { inspect } from 'util';

function isAgent(o: any): o is Agent {
    return (<Agent>o).isRegistered !== undefined;
}

const AgentProxyHandler = {
    get(target: Agent, propertyKey: PropertyKey, receiver: object) {
        let value = undefined;

        if (propertyKey in receiver) {
            value = target.game.agents.getAgentProperty(target, propertyKey);
        }

        if (value === undefined) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    set(target: Agent, propertyKey: PropertyKey, value: any, receiver: object) {
        return target.game.agents.setAgentProperty(target, propertyKey, value);
    },

    has(target: Agent, propertyKey: PropertyKey) {
        return target.game.agents.hasAgentProperty(target, propertyKey);
    }
}

export class Agent {

    private _id: number = undefined;
    game: GameInstance = undefined;

    get isRegistered(): boolean {
        return this._id !== undefined;
    }

    get id() {
        return this._id;
    }

    set id(value: number) {
        if (this.isRegistered) {
            throw new RegalError("Cannot change an agent's ID once it has been set.");
        }
        this._id = value;
    }

    register(game: GameInstance, newId?: number): this {
        if (!game) {
            throw new RegalError("The GameInstance must be defined to register the agent.");
        }
        if (this.isRegistered) {
            throw new RegalError("Cannot register an agent that already has an ID");
        }

        this.game = game;
        this._id = (newId !== undefined) ? newId : game.agents.getNextAgentId();

        // TODO: Register every agent that is managed by the agent.
        for (let property in this) {
            if (this.hasOwnProperty(property)) {
                const member = this[property];

                if (isAgent(member) && !member.isRegistered) {
                    member.register(game);
                }
            }
        }

        game.agents.addAgent(this);

        return new Proxy(this, AgentProxyHandler) as this;
    }

    static(): this {
        // TODO
        return this;
    }
}

export class InstanceAgents {

    agentCount: number = 1;

    getNextAgentId(): number {
        return this.agentCount + 1;
    }

    addAgent(agent: Agent): void {
        if (this.hasOwnProperty(agent.id)) {
            throw new RegalError(`An agent with ID <${agent.id}> has already been registered with the instance.`);
        }

        this[agent.id] = new AgentRecord(agent);
        this.agentCount++;
    }

    getAgentProperty(agent: Agent, property: PropertyKey): any {
        if (!this.hasOwnProperty(agent.id)) {
            throw new RegalError(`No agent with ID <${agent.id}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agent.id];

        return agentRecord.getProperty(property);
    }

    setAgentProperty(agent: Agent, property: PropertyKey, value: any): boolean {
        if (!this.hasOwnProperty(agent.id)) {
            throw new RegalError(`No agent with ID <${agent.id}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agent.id];
        agentRecord.setProperty(0, "TODO EVENT", property, value);

        return true;
    }

    hasAgentProperty(agent: Agent, property: PropertyKey): boolean {
        if (!this.hasOwnProperty(agent.id)) {
            throw new RegalError(`No agent with ID <${agent.id}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agent.id];
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

    constructor(agent: Agent) {
        for (let key in agent) {
            const arr = new Array<PropertyChange>();
            arr.push({
                op: PropertyOperation.ADDED,
                final: agent[key]
            });
            this[key] = arr;
        }
    }

    getProperty(propertyKey: PropertyKey): any {
        const changes: PropertyChange[] = this[propertyKey];

        if (changes !== undefined && changes.length > 0) {
            return changes[0].final;
        }

        return undefined;
    }

    setProperty<T>(eventId: number, eventName: string, property: PropertyKey, value: T): void {
        if (!this.hasOwnProperty(property)) {
            this._addRecord(eventId, eventName, property, PropertyOperation.ADDED, undefined, value);
        } else {
            const initValue = this.getProperty(property);
            this._addRecord(eventId, eventName, property, PropertyOperation.MODIFIED, initValue, value);
        }
    }

    private _addRecord<T>(eventId: number, eventName: string, property: PropertyKey, op: PropertyOperation, init?: T, final?: T): void {
        if (!(property in this)) {
            this[property] = new Array<PropertyChange>();
        }

        const change: PropertyChange = {
            eventId,
            eventName,
            op,
            init,
            final,
            property: property.toString()
        };

        (<PropertyChange[]>this[property]).unshift(change);
    }
}

// TODO
export class InstanceState extends Agent {

    constructor(public game: GameInstance) {
        super();
        this.id = 0;
    }

    register(game: GameInstance): undefined {
        throw new RegalError("InstanceState is a reserved agent and cannot be registered.");
    }

    static(): undefined {
        throw new RegalError("InstanceState is a reserved agent and cannot be made static.");
    }

}

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

const myGame = new GameInstance();

const lars = new Dummy("Lars", 10).register(myGame);
lars.health += 10;
lars["self"] = lars;
lars["self"].name = "Hoo woopdee";

console.log(inspect(myGame, {depth: Infinity}));

console.log(lars.name);
