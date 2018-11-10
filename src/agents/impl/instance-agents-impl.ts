import { RegalError } from "../../error";
import { GameInstance } from "../../state";
import { isAgent } from "../agent";
import {
    AgentArrayReference,
    isAgentArrayReference
} from "../agent-array-reference";
import { AgentManager, isAgentManager } from "../agent-manager";
import { AgentReference, isAgentReference } from "../agent-reference";
import { InstanceAgents, propertyIsAgentId } from "../instance-agents";
import { StaticAgentRegistry } from "../static-agent-registry";
import {
    buildActiveAgentArrayProxy,
    buildActiveAgentProxy
} from "./active-agent-proxy";
import { buildAgentManager } from "./agent-manager-impl";

/**
 * Builds an implementation of `InstanceAgents` for the given `GameInstance`
 * @param game The `GameInstance`.
 * @param nextId The next agent ID to start activation at (optional).
 */
export const buildInstanceAgents = (
    game: GameInstance,
    nextId?: number
): InstanceAgents => new InstanceAgentsImpl(game, nextId);

/** Implementation of `InstanceAgents`. */
class InstanceAgentsImpl implements InstanceAgents {
    private _nextId: number;

    constructor(public game: GameInstance, nextId?: number) {
        this.createAgentManager(0);
        this._nextId =
            nextId !== undefined
                ? nextId
                : StaticAgentRegistry.getNextAvailableId();
    }

    get nextId(): number {
        return this._nextId;
    }

    public agentManagers(): AgentManager[] {
        return Object.keys(this)
            .filter(propertyIsAgentId)
            .map(key => this[key] as AgentManager);
    }

    public reserveNewId(): number {
        const id = this._nextId;
        this._nextId++;

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
            if (value instanceof Array) {
                value = buildActiveAgentArrayProxy(value.id, this.game);
            } else {
                value = buildActiveAgentProxy(value.id, this.game);
            }
        } else if (isAgentReference(value)) {
            value = buildActiveAgentProxy(value.refId, this.game);
        } else if (isAgentArrayReference(value)) {
            value = buildActiveAgentArrayProxy(value.arRefId, this.game);
        }

        return value;
    }

    public getAgentPropertyKeys(id: number) {
        const am = this.getAgentManager(id);

        let keys: string[] = [];

        if (StaticAgentRegistry.hasAgent(id)) {
            const staticKeys = Object.keys(StaticAgentRegistry[id]);
            const instanceKeys = am === undefined ? [] : Object.keys(am);

            const keySet = new Set(staticKeys.concat(instanceKeys));
            keys = [...keySet]; // Remove duplicate keys
        } else {
            keys = Object.keys(am);
        }

        return keys.filter(key => this.hasAgentProperty(id, key));
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
            value =
                value instanceof Array
                    ? new AgentArrayReference((value as any).id)
                    : new AgentReference(value.id);
        } else if (value instanceof Array) {
            (value as any).id = this.reserveNewId();
            value = this.game.using(value);
            value = new AgentArrayReference(value.id);
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
