import { PKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";
import { PrototypeRegistry } from "../../prototype-registry";
import { buildAgentProtoPKProvider } from "./agent-proto-keys";
import { PrototypeRegistryImplBase } from "./prototype-registry-impl-base";

/**
 * Builds an implementation of `PrototypeRegistry`.
 */
export const buildPrototypeRegistry = (): PrototypeRegistry =>
    new PrototypeRegistryImpl();

class PrototypeRegistryImpl extends PrototypeRegistryImplBase {
    private _pkProvider = buildAgentProtoPKProvider();

    protected getProtoPKProvider(): PKProvider<AgentProtoId> {
        return this._pkProvider;
    }
}
