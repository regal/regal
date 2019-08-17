import { PKProvider } from "../../../common";
import { RegalError } from "../../../error";
import { Agent } from "../../agent";
import { AgentProtoId } from "../../agent-meta";
import { PrototypeRegistry } from "../../prototype-registry";
import { getInstanceStateAgentProtoPK } from "./agent-proto-keys";

export interface ProtoRegistryStore {
    [key: string]: object;
}

export abstract class PrototypeRegistryImplBase implements PrototypeRegistry {
    constructor(protected _store: ProtoRegistryStore = {}) {}

    public register(newObj: Agent): AgentProtoId {
        const existingId = this.getPrototypeIdOrDefault(newObj);
        if (existingId !== undefined) {
            return existingId;
        }

        const newProto = Object.getPrototypeOf(newObj);
        const newId = this.getProtoPKProvider().next();

        this._store[newId.value()] = newProto;
        return newId;
    }

    public newInstance(prototypeId: AgentProtoId): Agent {
        if (prototypeId.equals(getInstanceStateAgentProtoPK())) {
            return {} as any;
        }

        const instance = this.newInstanceOrDefault(prototypeId);

        if (instance === undefined) {
            throw new RegalError(
                `No prototype exists with the id <${prototypeId.value()}>.`
            );
        }

        return instance;
    }

    public newInstanceOrDefault(prototypeId: AgentProtoId): Agent {
        const proto = this._store[prototypeId.value()];
        return proto === undefined ? undefined : Object.create(proto);
    }

    public getPrototypeIdOrDefault(obj: Agent): AgentProtoId {
        const newProto = Object.getPrototypeOf(obj);

        for (const [id, proto] of Object.entries(this._store)) {
            if (newProto === proto) {
                return this.getProtoPKProvider().keyFromValue(id);
            }
        }

        return undefined;
    }

    public abstract copy(): PrototypeRegistry;

    protected abstract getProtoPKProvider(): PKProvider<AgentProtoId>;
}
