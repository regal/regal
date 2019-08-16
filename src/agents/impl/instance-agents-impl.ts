/*
 * Contains implementation of `InstanceAgentsInternal`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PKProvider } from "../../common";
import { RegalError } from "../../error";
import { GameInstanceInternal } from "../../state";
import { Agent, isAgent } from "../agent";
import {
    AgentArrayReference,
    isAgentArrayReference
} from "../agent-array-reference";
import { AgentManager, isAgentManager } from "../agent-manager";
import { AgentId, AgentProtoId, ReservedAgentProperty } from "../agent-meta";
import { AgentReference, isAgentReference } from "../agent-reference";
import { InstanceAgentsInternal } from "../instance-agents-internal";
import { PrototypeRegistry } from "../prototype-registry";
import { StaticAgentRegistry } from "../static-agent-registry";
import {
    buildActiveAgentArrayProxy,
    buildActiveAgentProxy
} from "./active-agent-proxy";
import { STATIC_AGENT_PK_PROVIDER } from "./agent-keys";
import { buildAgentManager } from "./agent-manager-impl";
import { agentMetaWithID } from "./agent-meta-transformers";
import {
    getGameInstancePK,
    isAgentActive,
    propertyIsAgentId
} from "./agent-utils";
import { getInstanceStateAgentProtoPK } from "./prototype/agent-proto-keys";
import { buildPrototypeRegistry } from "./prototype/prototype-registry-impl";
import { StaticPrototypeRegistry } from "./prototype/static-prototype-registry-impl";

/**
 * Builds an implementation of `InstanceAgentsInternal` for the given `GameInstance`
 * @param game The `GameInstance`.
 * @param pkProvider The existing agent PK provider (optional).
 */
export const buildInstanceAgents = (
    game: GameInstanceInternal,
    pkProvider?: PKProvider<Agent>,
    prototypeRegistry?: PrototypeRegistry
): InstanceAgentsInternal =>
    new InstanceAgentsImpl(game, pkProvider, prototypeRegistry);

/** Implementation of `InstanceAgentsInternal`. */
class InstanceAgentsImpl implements InstanceAgentsInternal {
    /** The internal `Agent` `PKProvider`. */
    private _pkProvider: PKProvider<Agent>;
    private _prototypeRegistry: PrototypeRegistry;

    constructor(
        public game: GameInstanceInternal,
        pkProvider: PKProvider<Agent>,
        prototypeRegistry: PrototypeRegistry
    ) {
        this._pkProvider =
            pkProvider !== undefined
                ? pkProvider
                : STATIC_AGENT_PK_PROVIDER.fork();
        this._prototypeRegistry =
            prototypeRegistry !== undefined
                ? prototypeRegistry // TODO: Deep copy
                : buildPrototypeRegistry();

        // Create agent manager for the game instance
        this.createAgentManager(getGameInstancePK());
    }

    public agentManagers(): AgentManager[] {
        return Object.keys(this)
            .filter(propertyIsAgentId)
            .map(key => this[key] as AgentManager);
    }

    public reserveNewId(): AgentId {
        const id = this._pkProvider.next();

        this.createAgentManager(id);

        return id;
    }

    public createAgentManager(id: AgentId): AgentManager {
        const am = buildAgentManager(id, this.game);

        if (id.equals(getGameInstancePK())) {
            am.setProtoId(getInstanceStateAgentProtoPK());
        }

        this[id.value()] = am;
        return am;
    }

    public getAgentProperty(id: AgentId, property: PropertyKey) {
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
            if (property === ReservedAgentProperty.META) {
                value = am.meta;
            } else if (am.hasPropertyRecord(property)) {
                value = am.getProperty(property);
            } else if (StaticAgentRegistry.hasAgent(id)) {
                value = StaticAgentRegistry.getAgentProperty(id, property);
            }
        }

        if (isAgent(value)) {
            if (value instanceof Array) {
                value = buildActiveAgentArrayProxy(value.meta.id, this.game);
            } else {
                const prototype = this.getAgentPrototypeByProtoId(
                    value.meta.protoId
                );
                value = buildActiveAgentProxy(
                    value.meta.id,
                    this.game,
                    prototype
                );
            }
        } else if (isAgentReference(value)) {
            const prototype = this._getAgentPrototypeByAgentId(value.refId);
            value = buildActiveAgentProxy(value.refId, this.game, prototype);
        } else if (isAgentArrayReference(value)) {
            value = buildActiveAgentArrayProxy(value.arRefId, this.game);
        }

        return value;
    }

    public getAgentPropertyKeys(id: AgentId) {
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
        id: AgentId,
        property: PropertyKey,
        value: any
    ): boolean {
        if (
            property === ReservedAgentProperty.META ||
            property === ReservedAgentProperty.GAME
        ) {
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

            const protoId = StaticAgentRegistry.getAgentProperty(
                id,
                ReservedAgentProperty.META
            ).protoId;
            am.setProtoId(protoId);
        }

        if (isAgent(value)) {
            if (!isAgentActive(value.meta.id)) {
                value.meta = agentMetaWithID(this.reserveNewId())(value.meta);
                value = this.game.using(value);
            }
            if (am.meta.protoId === undefined) {
                am.setProtoId(value.meta.protoId);
            }

            value =
                value instanceof Array
                    ? new AgentArrayReference((value as any).meta.id)
                    : new AgentReference(value.meta.id);
        } else if (value instanceof Array) {
            (value as any).meta = agentMetaWithID(this.reserveNewId())(
                {} as any // TODO - make meta for array
            );
            value = this.game.using(value);
            value = new AgentArrayReference(value.meta.id);
        }

        am.setProperty(property, value);

        return true;
    }

    public hasAgentProperty(id: AgentId, property: PropertyKey): boolean {
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

        if (property === ReservedAgentProperty.META) {
            return true;
        }

        const propExists = am.hasPropertyRecord(property) || staticPropExists;

        return propExists && !am.propertyWasDeleted(property);
    }

    public deleteAgentProperty(id: AgentId, property: PropertyKey): boolean {
        if (
            property === ReservedAgentProperty.META ||
            property === ReservedAgentProperty.GAME
        ) {
            throw new RegalError(
                `The agent's <${property}> property cannot be deleted.`
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

        am.deleteProperty(property);

        return true;
    }

    public getAgentManager(id: AgentId): AgentManager {
        const result = this[id.value()];

        if (isAgentManager(result)) {
            return result;
        }

        return undefined;
    }

    public recycle(newInstance: GameInstanceInternal): InstanceAgentsInternal {
        const newAgents = buildInstanceAgents(
            newInstance,
            this._pkProvider,
            this._prototypeRegistry
        );

        for (const formerAgent of this.agentManagers()) {
            const id = formerAgent.id;
            const am = newAgents.createAgentManager(id);
            am.setProtoId(formerAgent.meta.protoId);

            const propsToAdd = Object.keys(formerAgent).filter(
                key =>
                    key !== ReservedAgentProperty.GAME &&
                    key !== ReservedAgentProperty.META
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
        const q = [getGameInstancePK()]; // Start at the game instance

        while (q.length > 0) {
            const id = q.shift();
            seen.add(id.value());

            for (const prop of this.getAgentPropertyKeys(id)) {
                const val = this.getAgentProperty(id, prop);
                if (isAgent(val) && !seen.has(val.meta.id.value())) {
                    q.push(val.meta.id);
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

    public registerAgentPrototype(agent: Agent): AgentProtoId {
        let protoId = agent.meta.protoId;
        const am = this.getAgentManager(agent.meta.id);

        if (protoId !== undefined) {
            if (am === undefined || am.meta.protoId !== undefined) {
                return protoId;
            }
        } else {
            protoId = this._prototypeRegistry.register(agent);
        }

        am.setProtoId(protoId);
        return protoId;
    }

    public getAgentPrototypeByProtoId(protoId: AgentProtoId): object {
        const staticInstance = StaticPrototypeRegistry.newInstanceOrDefault(
            protoId
        );

        if (staticInstance !== undefined) {
            return staticInstance;
        }

        return this._prototypeRegistry.newInstance(protoId);
    }

    private _getAgentPrototypeByAgentId(agentId: AgentId): object {
        const meta = this.getAgentProperty(agentId, ReservedAgentProperty.META);
        const protoId = meta.protoId;
        return this.getAgentPrototypeByProtoId(protoId);
    }
}
