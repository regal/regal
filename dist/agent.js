"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = require("./game");
const StaticAgentProxyHandler = {
    get(target, propertyKey, receiver) {
        let value = Reflect.get(target, propertyKey);
        if (value === undefined) {
            value = exports.staticAgentRegistry.getAgentProperty(target.id, propertyKey);
        }
        return value;
    },
    set(target, propertyKey, value, receiver) {
        return Reflect.set(target, propertyKey, value, receiver);
    },
    has(target, propertyKey) {
        return exports.staticAgentRegistry.hasAgentProperty(target.id, propertyKey);
    }
};
class StaticAgentRegistry {
    constructor() {
        this.agentCount = 0;
    }
    addAgent(agent) {
        if (agent.isRegistered) {
            throw new game_1.RegalError("Cannot create a static version of an agent that has already been registered.");
        }
        if (agent.isStatic) {
            throw new game_1.RegalError("Cannot create more than one static version of an agent.");
        }
        const id = ++this.agentCount;
        agent.id = id;
        this[id] = agent;
        return new Proxy(new Agent(agent.id), StaticAgentProxyHandler);
    }
    getAgentProperty(agentId, propertyKey) {
        if (!this.hasOwnProperty(agentId)) {
            throw new game_1.RegalError(`No static agent with ID <${agentId}> exists in the registry.`);
        }
        return this[agentId][propertyKey];
    }
    hasAgent(agentId) {
        return this.hasOwnProperty(agentId);
    }
    hasAgentProperty(agentId, propertyKey) {
        return this.hasAgent(agentId) && this[agentId].hasOwnProperty(propertyKey);
    }
}
exports.StaticAgentRegistry = StaticAgentRegistry;
exports.staticAgentRegistry = new StaticAgentRegistry();
exports.resetRegistry = () => {
    exports.staticAgentRegistry = new StaticAgentRegistry();
};
function isAgent(o) {
    return o.isRegistered !== undefined;
}
const AgentProxyHandler = {
    get(target, propertyKey, receiver) {
        let value = undefined;
        if (propertyKey in receiver) {
            value = target.game.agents.getAgentProperty(target.id, propertyKey);
        }
        if (value === undefined) {
            value = Reflect.get(target, propertyKey, receiver);
        }
        return value;
    },
    set(target, propertyKey, value, receiver) {
        const currentEvent = target.game.events.getCurrentEvent();
        return target.game.agents.setAgentProperty(target.id, propertyKey, value, currentEvent);
    },
    has(target, propertyKey) {
        return target.game.agents.hasAgentProperty(target.id, propertyKey);
    }
};
class Agent {
    constructor(_id, game) {
        this._id = _id;
        this.game = game;
    }
    get isRegistered() {
        return this.game !== undefined;
    }
    get isStatic() {
        return this._id !== undefined && exports.staticAgentRegistry.hasAgent(this._id);
    }
    get id() {
        return this._id;
    }
    set id(value) {
        if (this._id !== undefined) {
            throw new game_1.RegalError("Cannot change an agent's ID once it has been set.");
        }
        this._id = value;
    }
    register(game, newId) {
        if (!game) {
            throw new game_1.RegalError("The GameInstance must be defined to register the agent.");
        }
        if (this.isRegistered) {
            throw new game_1.RegalError("Cannot register an agent more than once.");
        }
        this.game = game;
        if (newId !== undefined) {
            this.id = newId;
        }
        else if (!this.isStatic) {
            this.id = game.agents.getNextAgentId();
        }
        const currentEvent = game.events.getCurrentEvent();
        game.agents.addAgent(this, currentEvent);
        return new Proxy(this, AgentProxyHandler);
    }
    static() {
        return exports.staticAgentRegistry.addAgent(this);
    }
}
exports.Agent = Agent;
function isAgentReference(o) {
    return o.refId !== undefined;
}
class AgentReference {
    constructor(refId) {
        this.refId = refId;
    }
}
exports.AgentReference = AgentReference;
class InstanceAgents {
    constructor(game) {
        this.game = game;
    }
    getNextAgentId() {
        let i = exports.staticAgentRegistry.agentCount + 1;
        while (this.hasOwnProperty(i)) {
            i++;
        }
        return i;
    }
    addAgent(agent, event) {
        if (this.hasOwnProperty(agent.id)) {
            throw new game_1.RegalError(`An agent with ID <${agent.id}> has already been registered with the instance.`);
        }
        if (!agent.isStatic) {
            this[agent.id] = new AgentRecord();
            for (let key in agent) {
                this.setAgentProperty(agent.id, key, agent[key], event);
            }
        }
    }
    getAgentProperty(agentId, property) {
        const agentRecord = this[agentId];
        let value;
        if (agentRecord === undefined) {
            if (exports.staticAgentRegistry.hasAgent(agentId)) {
                value = exports.staticAgentRegistry.getAgentProperty(agentId, property);
            }
            else {
                throw new game_1.RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
            }
        }
        else {
            if (property in agentRecord) {
                value = agentRecord.getProperty(property);
            }
            else if (exports.staticAgentRegistry.hasAgentProperty(agentId, property)) {
                value = exports.staticAgentRegistry.getAgentProperty(agentId, property);
            }
            else {
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
    setAgentProperty(agentId, property, value, event) {
        if (!this.hasOwnProperty(agentId)) {
            if (exports.staticAgentRegistry.hasAgent(agentId)) {
                this[agentId] = new AgentRecord();
            }
            else {
                throw new game_1.RegalError(`No agent with ID <${agentId}> exists in the instance or the static registry.`);
            }
        }
        const agentRecord = this[agentId];
        if (isAgent(value)) {
            if (!value.isRegistered) {
                const game = this.getAgentProperty(agentId, "game");
                value = value.register(game);
            }
            value = new AgentReference(value.id);
        }
        agentRecord.setProperty(event, property, value);
        return true;
    }
    hasAgentProperty(agentId, property) {
        if (!this.hasOwnProperty(agentId)) {
            if (exports.staticAgentRegistry.hasAgent(agentId)) {
                return exports.staticAgentRegistry.hasAgentProperty(agentId, property);
            }
            throw new game_1.RegalError(`No agent with ID <${agentId}> exists in the instance.`);
        }
        const agentRecord = this[agentId];
        return agentRecord.hasOwnProperty(property);
    }
}
exports.InstanceAgents = InstanceAgents;
var PropertyOperation;
(function (PropertyOperation) {
    PropertyOperation["ADDED"] = "ADDED";
    PropertyOperation["MODIFIED"] = "MODIFIED";
    PropertyOperation["DELETED"] = "DELETED"; // TODO: support
})(PropertyOperation = exports.PropertyOperation || (exports.PropertyOperation = {}));
class AgentRecord {
    getProperty(propertyKey) {
        const changes = this[propertyKey];
        if (changes !== undefined && changes.length > 0) {
            return changes[0].final;
        }
        return undefined;
    }
    setProperty(event, property, value) {
        if (!this.hasOwnProperty(property)) {
            this._addRecord(event, property, PropertyOperation.ADDED, undefined, value);
        }
        else {
            const initValue = this.getProperty(property);
            this._addRecord(event, property, PropertyOperation.MODIFIED, initValue, value);
        }
    }
    _addRecord(event, property, op, init, final) {
        if (!(property in this)) {
            this[property] = new Array();
        }
        const change = {
            eventId: event.id,
            eventName: event.name,
            op,
            init,
            final
        };
        this[property].unshift(change);
    }
}
exports.AgentRecord = AgentRecord;
class InstanceState extends Agent {
    constructor(game) {
        super();
        return this.register(game, 0);
    }
}
exports.InstanceState = InstanceState;
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
//# sourceMappingURL=agent.js.map