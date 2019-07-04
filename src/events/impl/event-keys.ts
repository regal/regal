import { buildPKProvider } from "../../common";
import { EventRecord } from "../event-record";

export const EVENT_RESERVED_KEYS = {
    UNTRACKED: 100
};

const INTERNAL_EVENT_PK_PROVIDER = buildPKProvider<EventRecord>(
    EVENT_RESERVED_KEYS
);

export const getUntrackedEventPK = () =>
    INTERNAL_EVENT_PK_PROVIDER.reserved(EVENT_RESERVED_KEYS.UNTRACKED);
