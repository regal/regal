import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    AgentManager,
    buildAgentManager,
    isAgentManager
} from "./agent-manager";
import { activeAgentProxy, isAgent } from "./agent-model";
import { AgentReference, isAgentReference } from "./agent-reference";
import { StaticAgentRegistry } from "./static-agent-registry";

export interface InstanceAgents {
    game: GameInstance;
    agentManagers(): AgentManager[];
    getAgentManager(id: number): AgentManager;
    reserveNewId(): number;
    getAgentProperty(id: number, property: PropertyKey): any;
    setAgentProperty(id: number, property: PropertyKey, value: any): boolean;
    hasAgentProperty(id: number, property: PropertyKey): boolean;
    deleteAgentProperty(id: number, property: PropertyKey): boolean;
}

export const buildInstanceAgents = (game: GameInstance): InstanceAgents =>
    new InstanceAgentsImpl(game);

export const recycleInstanceAgents = (
    oldAgents: InstanceAgents,
    newInstance: GameInstance
): InstanceAgents => {
    const newAgents = new InstanceAgentsImpl(newInstance);

    for (const formerAgent of oldAgents.agentManagers()) {
        const id = formerAgent.id;
        const am = newAgents.createAgentManager(id);

        const propsToAdd = Object.keys(formerAgent).filter(
            key => key !== "game" && key !== "id"
        );

        propsToAdd.forEach(prop => {
            if (formerAgent.propertyWasDeleted(prop)) {
                if (StaticAgentRegistry.hasAgentProperty(id, prop)) {
                    am.deleteProperty(prop);
                }
                return;
            }

            let formerValue = formerAgent.getProperty(prop);

            if (isAgentReference(formerValue)) {
                formerValue = new AgentReference(formerValue.refId);
            }

            am.setProperty(prop, formerValue);
        });
    }

    return newAgents;
};

export const propertyIsAgentId = (property: PropertyKey) => {
    const tryNum = Math.floor(Number(property));
    return tryNum !== Infinity && String(tryNum) === property && tryNum >= 0;
};

class InstanceAgentsImpl implements InstanceAgents {
    constructor(public game: GameInstance) {
        this.createAgentManager(0);
    }

    public agentManagers(): AgentManager[] {
        return Object.keys(this)
            .filter(propertyIsAgentId)
            .map(key => this[key] as AgentManager);
    }

    public reserveNewId(): number {
        const agentKeys = Object.keys(this).filter(propertyIsAgentId);
        let id = StaticAgentRegistry.getNextAvailableId();

        while (agentKeys.includes(id.toString())) {
            id++;
        }

        this.createAgentManager(id);

        return id;
    }

    public createAgentManager(id: number): AgentManager {
        const am = buildAgentManager(id, this.game);
        this[id] = am;
        return am;
    }

    public getAgentProperty(id: number, property: PropertyKey) {
        const am = this.getAgentManager(id);
        let value: any;

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            value = StaticAgentRegistry.getAgentProperty(id, property);
        } else {
            if (property === "id") {
                value = id;
            } else if (am.hasPropertyRecord(property)) {
                value = am.getProperty(property);
            } else if (StaticAgentRegistry.hasAgent(id)) {
                value = StaticAgentRegistry.getAgentProperty(id, property);
            }
        }

        if (isAgent(value)) {
            value = activeAgentProxy(value.id, this.game);
        } else if (isAgentReference(value)) {
            value = activeAgentProxy(value.refId, this.game);
        }

        return value;
    }

    public setAgentProperty(
        id: number,
        property: PropertyKey,
        value: any
    ): boolean {
        if (property === "id" || property === "game") {
            throw new RegalError(
                `The agent's <${property}> property cannot be set.`
            );
        }

        let am = this.getAgentManager(id);

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            am = this.createAgentManager(id);
        }

        if (isAgent(value)) {
            if (value.id < 0) {
                const newId = this.reserveNewId();
                value.id = newId;
                value = this.game.using(value);
            }
            value = new AgentReference(value.id);
        }

        am.setProperty(property, value);

        return true;
    }

    public hasAgentProperty(id: number, property: PropertyKey): boolean {
        const am = this.getAgentManager(id);

        const staticPropExists = StaticAgentRegistry.hasAgentProperty(
            id,
            property
        );

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            return staticPropExists;
        }

        if (property === "id") {
            return true;
        }

        const propExists = am.hasPropertyRecord(property) || staticPropExists;

        return propExists && !am.propertyWasDeleted(property);
    }

    public deleteAgentProperty(id: number, property: PropertyKey): boolean {
        if (property === "id" || property === "game") {
            throw new RegalError(
                `The agent's <${property}> property cannot be deleted.`
            );
        }

        let am = this.getAgentManager(id);

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(`No agent with the id <${id}> exists.`);
            }

            am = this.createAgentManager(id);
        }

        am.deleteProperty(property);

        return true;
    }

    public getAgentManager(id: number): AgentManager {
        const result = this[id];

        if (isAgentManager(result)) {
            return result;
        }

        return undefined;
    }
}
