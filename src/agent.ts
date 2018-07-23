import { GameInstance, RegalError } from "./game";
import { Event } from "./event";
import { inspect } from 'util';

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

        const currentEvent = game.events.getCurrentEvent();
        game.agents.addAgent(this, currentEvent);

        return new Proxy(this, AgentProxyHandler) as this;
    }

    static(): this {
        // TODO
        return this;
    }
}

function isAgentReference(o: any): o is AgentReference {
    return (<AgentReference>o).refId !== undefined;
}

// TODO
export interface AgentReference {
    refId: number
}

export class InstanceAgents {

    agentCount: number = 0;

    getNextAgentId(): number {
        return this.agentCount + 1;
    }

    addAgent(agent: Agent, event: Event): void {
        if (this.hasOwnProperty(agent.id)) {
            throw new RegalError(`An agent with ID <${agent.id}> has already been registered with the instance.`);
        }

        this[agent.id] = new AgentRecord(agent, event);
        this.agentCount++;
    }

    getAgentProperty(agentId: number, property: PropertyKey): any {
        if (!this.hasOwnProperty(agentId)) {
            throw new RegalError(`No agent with ID <${agentId}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agentId];

        return agentRecord.getProperty(property);
    }

    setAgentProperty(agentId: number, property: PropertyKey, value: any, event: Event): boolean {
        if (!this.hasOwnProperty(agentId)) {
            throw new RegalError(`No agent with ID <${agentId}> exists in the instance.`);
        }

        const agentRecord: AgentRecord = this[agentId];
        agentRecord.setProperty(event, property, value);

        return true;
    }

    hasAgentProperty(agentId: number, property: PropertyKey): boolean {
        if (!this.hasOwnProperty(agentId)) {
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

    constructor(agent: Agent, event: Event) {
        for (let key in agent) {
            const arr = new Array<PropertyChange>();

            arr.push({
                eventId: event.id,
                eventName: event.name,
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
myGame.events.push("zop");
lars["self"].name = "Hoo woopdee";

console.log(inspect(myGame, {depth: Infinity}));

console.log(lars.name);
