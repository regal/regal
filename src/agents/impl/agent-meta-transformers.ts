import { PK } from "../../common";
import { Agent } from "../agent";
import { AgentMeta } from "../agent-meta";
import { STATIC_AGENT_PK_PROVIDER } from "./agent-keys";
import { getInactiveAgentPK } from "./agent-utils";

const transformMeta = (
    transformer: (meta?: AgentMeta) => Partial<AgentMeta>
) => (oldMeta: AgentMeta) => ({ ...oldMeta, ...transformer(oldMeta) });

export const defaultAgentMeta = (): AgentMeta => ({
    id: undefined,
    protoId: undefined
});

export const initStaticAgentMeta = transformMeta(() => ({
    id: STATIC_AGENT_PK_PROVIDER.next()
}));

export const initInactiveAgentMeta = transformMeta(() => ({
    id: getInactiveAgentPK()
}));

export const activateAgentMeta = (id: PK<Agent>) =>
    transformMeta(() => ({
        id
    }));
