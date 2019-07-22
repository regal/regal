/*
 * Contains the `EventRecord` primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider } from "../../common";
import { EventRecord } from "../event-record";

/** The set of reserved `EventRecord` primary keys. */
export const EVENT_RESERVED_KEYS = {
    /**
     * The key for all changes made in the default, untracked `EventRecord`.
     *
     * **No reserved event keys should have a greater value than this!**
     */
    UNTRACKED: 100
};

/**
 * Reference this `PKProvider` for helper functions to get reserved `EventRecord`
 * PKs so we don't have to do additional instantiations.
 */
const INTERNAL_EVENT_PK_PROVIDER = buildPKProvider<EventRecord>(
    EVENT_RESERVED_KEYS
);

/** Shorthand for the `EVENT_RESERVED_KEYS.UNTRACKED` primary key. */
export const getUntrackedEventPK = () =>
    INTERNAL_EVENT_PK_PROVIDER.reserved(EVENT_RESERVED_KEYS.UNTRACKED);
