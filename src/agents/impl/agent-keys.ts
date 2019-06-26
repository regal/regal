import { buildPKProvider } from "../../common";

export const AGENT_RESERVED_KEYS = {
    GAME_INSTANCE: 100,
    INACTIVE: 99
};

export let STATIC_AGENT_PK_PROVIDER = buildPKProvider(AGENT_RESERVED_KEYS);
