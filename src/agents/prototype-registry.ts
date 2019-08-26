/*
 * Contains interfaces for prototype registries, which manage the prototypes
 * of all `Agent` subclasses.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { Agent } from "./agent";
import { AgentProtoId } from "./agent-meta";

/**
 * Manages the prototypes of all `Agent` subclasses.
 *
 * Every instance of a given `Agent` subclass has a `protoId` meta property,
 * which refers to a prototype object stored in some `PrototypeRegistry`
 * (either the `StaticPrototypeRegistry` or an instance-specific registry
 * in the game instance's `InstanceAgents`).
 *
 * These managed prototypes allow agent proxies, which contain
 * no data in themselves, to have methods.
 */
export interface PrototypeRegistry {
    /**
     * Checks if a new agent's prototype exists in the registry.
     * If it does, the existing `protoId` is returned. If not, the prototype
     * is added to the registry and assigned a new `protoId`, which is returned.
     * @param newObj The new object.
     */
    register(newObj: Agent): AgentProtoId;

    /**
     * Creates an agent from the registered prototype specified by the given id,
     * using `Object.create()`. Throws an error if no prototype exists with the id.
     * @param prototypeId The prototype id.
     */
    newInstance(prototypeId: AgentProtoId): Agent;

    /**
     * Creates an agent from the registered prototype specified by the given id,
     * using `Object.create()`. Returns `undefined` if no prototype exists with the id.
     * @param prototypeId The prototype id.
     */
    newInstanceOrDefault(prototypeId: AgentProtoId): Agent;

    /**
     * Gets the `protoId` which corresponds to the given prototype, or returns undefined
     * if none exists.
     * @param obj The `Agent` prototype.
     */
    getPrototypeIdOrDefault(obj: Agent): AgentProtoId;

    /** Makes a deep copy of this `PrototypeRegistry`. */
    copy(): PrototypeRegistry;
}

/**
 * Specific kind of `PrototypeRegistry` that contains the prototypes of all
 * static agents.
 */
export interface IStaticPrototypeRegistry extends PrototypeRegistry {
    /** Clears the registry of all prototypes and resets the id counter. */
    reset(): void;
}
