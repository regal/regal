/*
 * Contains the non-static `PrototypeRegistry` implementation.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";
import { PrototypeRegistry } from "../../prototype-registry";
import {
    ProtoRegistryStore,
    PrototypeRegistryImplBase
} from "./prototype-registry-impl-base";

/**
 * Builds an implementation of `PrototypeRegistry`.
 */
export const buildPrototypeRegistry = (
    pkProvider: PKProvider<AgentProtoId>
): PrototypeRegistry => new PrototypeRegistryImpl(pkProvider);

/**
 * Non-static `PrototypeRegistry` implementation.
 */
class PrototypeRegistryImpl extends PrototypeRegistryImplBase {
    constructor(
        private _pkProvider: PKProvider<AgentProtoId>,
        store?: ProtoRegistryStore
    ) {
        super(store);
    }

    public copy(): PrototypeRegistry {
        return new PrototypeRegistryImpl(this._pkProvider.fork(), {
            ...this._store
        });
    }

    protected getProtoPKProvider(): PKProvider<AgentProtoId> {
        return this._pkProvider;
    }
}
