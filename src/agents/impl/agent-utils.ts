import { PK } from "../../common";
import { Agent } from "../agent";
import { AGENT_RESERVED_KEYS, STATIC_AGENT_PK_PROVIDER } from "./agent-keys";

export const getInactiveAgentPK = () =>
    STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.INACTIVE);

export const isAgentActive = (id: PK<Agent>) =>
    !getInactiveAgentPK().equals(id);

export const getGameInstancePK = () =>
    STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.GAME_INSTANCE);
