import { buildPKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";

export const AGENT_PROTO_RESERVED_KEYS = {
    GAME_INSTANCE: 0
};

export const buildAgentProtoPKProvider = () => buildPKProvider<AgentProtoId>();
