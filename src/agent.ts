import { GameInstance, RegalError } from "./game";
import { inspect } from 'util';

const AgentProxyHandler = {
    get(target: Agent, propertyKey: string, receiver: object) {
        let value = undefined;

        if (propertyKey in target) {
            if (target.hasOwnProperty(propertyKey)) {
                console.log(propertyKey);

                if (["game", "id", "_id", "isRegistered"].includes(propertyKey)) {
                    value = Reflect.get(target, propertyKey, receiver);
                }
                else {
                    const instanceDiff = target.game.diff;
                    value = instanceDiff.getAgentProperty(target, propertyKey);

                    if (value === undefined) {
                        const instanceAgents = target.game.agents;
                        value = instanceAgents.getAgentProperty(target, propertyKey);
                    }
                }
            }
        }

        if (value === undefined) {
            value = Reflect.get(target, propertyKey, receiver);
        }

        return value;
    },

    set(target: Agent, propertyKey: string, value: any, receiver: object) {
        const instanceDiff = target.game.diff;
        return instanceDiff.setAgentProperty(target, propertyKey, value);
    }
}

function isAgent(o: any): o is Agent {
    return (<Agent>o).isRegistered !== undefined;
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

        const agentProxy = new Proxy(this, AgentProxyHandler);

        return agentProxy as this;
    }

    static(): this {
        // TODO
        return this;
    }
}

// const InstanceAgentsProxyHandler = {
//     set(target: InstanceAgents, propertyKey: string, value: any, receiver: object) {
//         // TODO
//         return AgentProxyHandler.set(target, propertyKey, value, receiver);
//     }
// };

export class InstanceAgents {

    agentCount: number = 1;

    constructor(game: GameInstance) {
        super();
        this.game = game;
        this.id = 1;
        // return this.register(game, 1);
        // this.id = 1;
    }

    register(game: GameInstance): undefined {
        throw new RegalError("InstanceAgents is a reserved agent and cannot be registered.");
    }

    static(): undefined {
        throw new RegalError("InstanceAgents is a reserved agent and cannot be made static.");
    }

    getNextAgentId(): number {
        return this.agentCount + 1;
    }

    addAgent(agent: Agent): void {
        if (agent.id in this) {
            throw new RegalError(`An agent with ID <${agent.id}> has already been registered with the instance.`);
        }

        this[agent.id] = agent;
        this.agentCount++;
    }

    getAgentProperty(agent: Agent, property: PropertyKey): any {
        if (!(agent.id in this)) {
            throw new RegalError(`No agent with ID <${agent.id}> exists in the instance.`);
        }

        return this[agent.id][property];
    }
}

export class InstanceDiff {

    getAgentProperty(agent: Agent, propertyKey: PropertyKey): any {
        let propertyValue = undefined;

        if (this.hasOwnProperty(agent.id)) {
            const agentRecord = (<AgentRecord>this[agent.id]);
            propertyValue = agentRecord.getMostRecentPropertyValue(propertyKey);
        }

        return propertyValue;
    }

    setAgentProperty(agent: Agent, propertyKey: PropertyKey, value: any): boolean {

        // ** This block works... just trying to refactor **

        // // If the value is being set to what it already is, do nothing.
        // if (agent.game.agents.getAgentProperty(agent, propertyKey) === value) {
        //     return true;
        // }

        // if (!this.hasOwnProperty(agent.id)) {
        //     this[agent.id] = new AgentRecord();
        // }

        // const agentRecord = (<AgentRecord>this[agent.id]);

        // const initValue = agentRecord.getMostRecentPropertyValue(propertyKey);
        // if (initValue === value) {
        //     return true;
        // }

        // if (initValue === undefined) {
        //     agentRecord.add(0, "ADD", propertyKey.toString(), value);
        // } else {
        //     agentRecord.modify(0, "MODIFY", propertyKey.toString(), initValue, value);
        // }

        // return true;

        const originalValue = agent.game.agents.getAgentProperty(agent, propertyKey);

        if (!this.hasOwnProperty(agent.id)) {
            if (value === originalValue) {
                return true;
            }

            this[agent.id] = new AgentRecord();
            
            if (originalValue === undefined) {
                agentRecord.add() // todo
            } else {

            }
        }
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

    getMostRecentPropertyValue(propertyKey: PropertyKey): any {
        const changes: PropertyChange[] = this[propertyKey];

        if (changes !== undefined && changes.length > 0) {
            return changes[0].final;
        }

        return undefined;
    }

    private _addRecord<T>(eventId: number, eventName: string, property: string, op: PropertyOperation, init?: T, final?: T): void {
        if (!(property in this)) {
            this[property] = new Array<PropertyChange>();
        }

        const change: PropertyChange = {
            eventId,
            eventName,
            op,
            init,
            final,
            property
        };

        (<PropertyChange[]>this[property]).unshift(change);
    }

    modify<T>(eventId: number, eventName: string, property: string, init: T, final: T): void {
        return this._addRecord(eventId, eventName, property, PropertyOperation.MODIFIED, init, final);
    }

    add<T>(eventId: number, eventName: string, property: string, value: T): void {
        return this._addRecord(eventId, eventName, property, PropertyOperation.ADDED, undefined, value);
    }

    delete<T>(eventId: number, eventName: string, property: string, value: T) {
        return this._addRecord(eventId, eventName, property, PropertyOperation.DELETED, value);
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

class Foo extends Agent {
    constructor(public str: string) {
        super();
    }
}

const myGame = new GameInstance();

const foo = new Foo("Foo 1").register(myGame);
const foo2 = new Foo("Foo 2").register(myGame);
foo.str = "Foo 1 Next";
console.log(inspect(myGame, {depth: Infinity}));
console.log(foo.str);
