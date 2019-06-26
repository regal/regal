/*
 * Contains implementation of `InstanceAgentsInternal`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { Mutable, PK, PKProvider } from "../../common";
import { RegalError } from "../../error";
import { GameInstanceInternal } from "../../state";
import { Agent, isAgent } from "../agent";
import {
    AgentArrayReference,
    isAgentArrayReference
} from "../agent-array-reference";
import { AgentManager, isAgentManager } from "../agent-manager";
import { AgentReference, isAgentReference } from "../agent-reference";
import {
    InstanceAgentsInternal,
    propertyIsAgentId
} from "../instance-agents-internal";
import { StaticAgentRegistry } from "../static-agent-registry";
import {
    buildActiveAgentArrayProxy,
    buildActiveAgentProxy
} from "./active-agent-proxy";
import { AGENT_RESERVED_KEYS, STATIC_AGENT_PK_PROVIDER } from "./agent-keys";
import { buildAgentManager } from "./agent-manager-impl";
import { isAgentActive } from "./agent-utils";

/**
 * Builds an implementation of `InstanceAgentsInternal` for the given `GameInstance`
 * @param game The `GameInstance`.
 * @param pkProvider The existing agent PK provider (optional).
 */
export const buildInstanceAgents = (
    game: GameInstanceInternal,
    pkProvider?: PKProvider<Agent>
): InstanceAgentsInternal => new InstanceAgentsImpl(game, pkProvider);

/** Implementation of `InstanceAgentsInternal`. */
class InstanceAgentsImpl implements InstanceAgentsInternal {
    private _pkProvider: PKProvider<Agent>;

    constructor(
        public game: GameInstanceInternal,
        pkProvider: PKProvider<Agent>
    ) {
        this._pkProvider =
            pkProvider !== undefined
                ? pkProvider
                : STATIC_AGENT_PK_PROVIDER.fork();

        // Create agent manager for the game instance
        this.createAgentManager(
            this._pkProvider.reserved(AGENT_RESERVED_KEYS.GAME_INSTANCE)
        );
    }

    public agentManagers(): AgentManager[] {
        return Object.keys(this)
            .filter(propertyIsAgentId)
            .map(key => this[key] as AgentManager);
    }

    public reserveNewId(): PK<Agent> {
        const id = this._pkProvider.next();

        this.createAgentManager(id);

        return id;
    }

    public createAgentManager(id: PK<Agent>): AgentManager {
        const am = buildAgentManager(id, this.game);
        this[id.value()] = am;
        return am;
    }

    public getAgentProperty(id: PK<Agent>, property: PropertyKey) {
        const am = this.getAgentManager(id);
        let value: any;

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(
                    `No agent with the id <${id.value()}> exists.`
                );
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

    public getAgentPropertyKeys(id: PK<Agent>) {
        const am = this.getAgentManager(id);

        let keys: string[] = [];

        if (StaticAgentRegistry.hasAgent(id)) {
            const staticKeys = Object.keys(StaticAgentRegistry[id.value()]);
            const instanceKeys = am === undefined ? [] : Object.keys(am);

            const keySet = new Set(staticKeys.concat(instanceKeys));
            keys = [...keySet]; // Remove duplicate keys
        } else {
            keys = Object.keys(am);
        }

        return keys.filter(key => this.hasAgentProperty(id, key));
    }

    public setAgentProperty(
        id: PK<Agent>,
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
                throw new RegalError(
                    `No agent with the id <${id.value()}> exists.`
                );
            }

            am = this.createAgentManager(id);
        }

        if (isAgent(value)) {
            if (!isAgentActive(value.id)) {
                const newId = this.reserveNewId();
                (value as Mutable<Agent>).id = newId;
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

    public hasAgentProperty(id: PK<Agent>, property: PropertyKey): boolean {
        const am = this.getAgentManager(id);

        const staticPropExists = StaticAgentRegistry.hasAgentProperty(
            id,
            property
        );

        if (!isAgentManager(am)) {
            if (!StaticAgentRegistry.hasAgent(id)) {
                throw new RegalError(
                    `No agent with the id <${id.value()}> exists.`
                );
            }

            return staticPropExists;
        }

        if (property === "id") {
            return true;
        }

        const propExists = am.hasPropertyRecord(property) || staticPropExists;

        return propExists && !am.propertyWasDeleted(property);
    }

    public deleteAgentProperty(id: PK<Agent>, property: PropertyKey): boolean {
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

    public getAgentManager(id: PK<Agent>): AgentManager {
        const result = this[id.value()];

        if (isAgentManager(result)) {
            return result;
        }

        return undefined;
    }

    public recycle(newInstance: GameInstanceInternal): InstanceAgentsInternal {
        const newAgents = buildInstanceAgents(newInstance, this._pkProvider);

        for (const formerAgent of this.agentManagers()) {
            const id = formerAgent.id;
            const am = newAgents.createAgentManager(id);

            const propsToAdd = Object.keys(formerAgent).filter(
                key => key !== "game" && key !== "id"
            );

            // For each updated property on the old agent, add its last value to the new agent.
            propsToAdd.forEach(prop => {
                if (formerAgent.propertyWasDeleted(prop)) {
                    if (StaticAgentRegistry.hasAgentProperty(id, prop)) {
                        am.deleteProperty(prop); // Record deletions to static agents.
                    }

                    return; // If the property was deleted, don't add it to the new record.
                }

                let formerValue = formerAgent.getProperty(prop);

                if (isAgentReference(formerValue)) {
                    formerValue = new AgentReference(formerValue.refId);
                }

                am.setProperty(prop, formerValue);
            });
        }

        return newAgents;
    }

    public scrubAgents(): void {
        const seen = new Set<string>();
        const q = [
            this._pkProvider.reserved(AGENT_RESERVED_KEYS.GAME_INSTANCE)
        ]; // Start at the game instance

        while (q.length > 0) {
            const id = q.shift();
            seen.add(id.value());

            for (const prop of this.getAgentPropertyKeys(id)) {
                const val = this.getAgentProperty(id, prop);
                if (isAgent(val) && !seen.has(val.id.value())) {
                    q.push(val.id);
                }
            }
        }

        const waste = Object.keys(this)
            .filter(propertyIsAgentId)
            .filter(id => !seen.has(id));

        for (const id of waste) {
            delete this[id];
        }
    }
}
