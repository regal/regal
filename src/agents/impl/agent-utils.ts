/*
 * Contains various utilities for the Agents component.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../../common";
import { Agent } from "../agent";
import { AGENT_RESERVED_KEYS, STATIC_AGENT_PK_PROVIDER } from "./agent-keys";

/** Shorthand for the `AGENT_RESERVED_KEYS.INACTIVE` primary key. */
export const getInactiveAgentPK = () =>
    STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.INACTIVE);

/** Shorthand for the `AGENT_RESERVED_KEYS.GAME_INSTANCE` primary key. */
export const getGameInstancePK = () =>
    STATIC_AGENT_PK_PROVIDER.reserved(AGENT_RESERVED_KEYS.GAME_INSTANCE);

/** Determines whether an `Agent` has been activated, given its primary key. */
export const isAgentActive = (id: PK<Agent>) =>
    !getInactiveAgentPK().equals(id);
