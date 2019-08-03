import { buildPKProvider } from "../../../common";
import { AgentProtoId } from "../../agent-meta";

export const buildAgentProtoPKProvider = () => buildPKProvider<AgentProtoId>();
