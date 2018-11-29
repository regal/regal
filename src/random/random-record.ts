/*
 * Contains `RandomRecord` interface.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Record of a single random value's generation.
 */
export interface RandomRecord {
    /** The random value's numeric id. */
    id: number;
    /** The random value. */
    value: number | string | boolean;
}
