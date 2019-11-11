/*
 * Contains `RandomRecord` interface.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK } from "../common";

/** A random record primary key. */
export type RandomRecordId = PK<RandomRecord>;

/**
 * Record of a single random value's generation.
 */
export interface RandomRecord {
    /** The random value's unique id. */
    id: RandomRecordId;
    /** The random value. */
    value: number | string | boolean;
}
