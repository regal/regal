/*
 * Contains the constructor for inactive agent proxies.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../../error";
import { ContextManager } from "../../state";
import { Agent } from "../agent";
import { StaticAgentRegistry } from "../static-agent-registry";

/**
 * Builds a proxy for an inactive agent. Before an agent is activated
 * by a `GameInstance`, it is considered inactive.
 *
 * Inactive agents are initialize-only, meaning that their properties
 * may optionally be set once, but they may not be read or modified
 * until the agent is activated.
 *
 * An exception to this rule is that inactive agents may be read and
 * modified in the game's static context (i.e. outside of a game cycle).
 * Agents created in the static context are called static agents, and
 * they still must be activated by a `GameInstance` before they can be
 * used in a game cycle.
 *
 * @param agent The agent to be proxied.
 * @returns The inactive agent proxy.
 */
export const buildInactiveAgentProxy = (agent: Agent): Agent =>
    new Proxy(agent, {
        /** Hidden property that contains any initialized values. */
        tempValues: {},

        get(target: Agent, property: PropertyKey) {
            if (property === "tempValues") {
                return this.tempValues;
            }

            if (
                property !== "id" &&
                property !== "refId" &&
                !ContextManager.isContextStatic()
            ) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be accessed within a game cycle."
                );
            }

            return Reflect.get(target, property);
        },

        set(target: Agent, property: PropertyKey, value: any) {
            if (property === "id" && target.id < 0) {
                return Reflect.set(target, property, value);
            }

            if (ContextManager.isContextStatic()) {
                // When adding an array as a property of a static agent, we need to
                // treat that array like an agent and register a static id for it
                if (value instanceof Array && (value as any).id === undefined) {
                    (value as any).id = StaticAgentRegistry.getNextAvailableId();
                    StaticAgentRegistry.addAgent(value as any);
                }
                return Reflect.set(target, property, value);
            } else if (StaticAgentRegistry.hasAgent(target.id)) {
                throw new RegalError(
                    "This static agent must be activated before it may be modified."
                );
            }

            // Allow initial values to be set (like from a constructor) but ONLY ONCE.
            if (this.tempValues[property] !== undefined) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be set within a game cycle."
                );
            }

            this.tempValues[property] = value;

            return true;
        },

        deleteProperty(target: Agent, property: PropertyKey) {
            if (!ContextManager.isContextStatic()) {
                throw new RegalError(
                    "The properties of an inactive agent cannot be deleted within a game cycle."
                );
            }

            return Reflect.deleteProperty(target, property);
        }
    } as ProxyHandler<Agent>);
