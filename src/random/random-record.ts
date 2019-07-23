/*
 * Contains `RandomRecord` interface.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../common";

/**
 * Record of a single random value's generation.
 */
export interface RandomRecord {
    /** The random value's unique id. */
    id: PK<RandomRecord>;
    /** The random value. */
    value: number | string | boolean;
}
