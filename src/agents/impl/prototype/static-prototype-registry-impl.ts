import { PKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";
import { IStaticPrototypeRegistry } from "../../prototype-registry";
import { buildAgentProtoPKProvider } from "./agent-proto-keys";
import { PrototypeRegistryImplBase } from "./prototype-registry-impl-base";

const STATIC_PROTO_PK_PROVIDER = buildAgentProtoPKProvider();

/** Implementation of `IStaticPrototypeRegistry`. */
class StaticPrototypeRegistryImpl extends PrototypeRegistryImplBase
    implements IStaticPrototypeRegistry {
    public reset(): void {
        this._store = {};
        STATIC_PROTO_PK_PROVIDER.reset();
    }

    protected getProtoPKProvider(): PKProvider<AgentProtoId> {
        return STATIC_PROTO_PK_PROVIDER;
    }
}

/**
 * Manages the prototypes of all static agents.
 *
 * When a new instance of an agent class is created, its prototype is registered
 * in a prototype registry (either this one or an instance-specific one). This
 * allows all agents of a given class to share the same prototype object.
 *
 * If non-static agents are instantiated later and their prototypes already exist
 * in this registry, they will not be added to the instance-specific prototype registry
 * in `InstanceAgents`. Therefore, you can reduce the size of your `GameInstance`
 * by declaring at least one static agent for the majority of your agent classes.
 */
// tslint:disable-next-line: variable-name
export const StaticPrototypeRegistry: IStaticPrototypeRegistry = new StaticPrototypeRegistryImpl();
