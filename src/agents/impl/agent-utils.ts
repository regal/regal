import { PK } from "../../common";
import { Agent } from "../agent";
import { AGENT_RESERVED_KEYS, STATIC_AGENT_PK_PROVIDER } from "./agent-keys";

export const isAgentActive = (id: PK<Agent>) =>
    !STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.INACTIVE).equals(id);

export const gameInstancePK = () =>
    STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.GAME_INSTANCE);
