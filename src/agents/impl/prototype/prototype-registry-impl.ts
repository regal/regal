import { PKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";
import { PrototypeRegistry } from "../../prototype-registry";
import { PrototypeRegistryImplBase } from "./prototype-registry-impl-base";
import { STATIC_PROTO_PK_PROVIDER } from "./static-prototype-registry-impl";

/**
 * Builds an implementation of `PrototypeRegistry`.
 */
export const buildPrototypeRegistry = (): PrototypeRegistry =>
    new PrototypeRegistryImpl();

class PrototypeRegistryImpl extends PrototypeRegistryImplBase {
    private _pkProvider = STATIC_PROTO_PK_PROVIDER.fork();

    protected getProtoPKProvider(): PKProvider<AgentProtoId> {
        return this._pkProvider;
    }
}
