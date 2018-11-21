/*
 * Contains the internal interface for `InstanceOptions`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";
import { GameOptions } from "./game-options";
import { InstanceOptions } from "./instance-options";

/**
 * Internal interface for `InstanceOptions`.
 */
export interface InstanceOptionsInternal extends InstanceOptions {
    /** The `GameInstance that owns this `InstanceOptions` */
    readonly game: GameInstance;

    /** Options that have had their static values overridden by the client. */
    readonly overrides: Partial<GameOptions>;
}
