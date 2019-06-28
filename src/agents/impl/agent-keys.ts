/*
 * Contains the `Agent` primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { buildPKProvider } from "../../common";

/** The set of reserved `Agent` primary keys. */
export const AGENT_RESERVED_KEYS = {
    /** Every `GameInstance` has this key. */
    GAME_INSTANCE: 100,
    /** Before an `Agent` is activated, it has this key. */
    INACTIVE: 99
};

/** The `Agent` `PKProvider` for static agents. */
export const STATIC_AGENT_PK_PROVIDER = buildPKProvider(AGENT_RESERVED_KEYS);
