/*
 * Contains the API for the Regal Game Library random component.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Interface for generating deterministic, pseudo-random data for the game instance.
 *
 * The data are considered deterministic because any `InstanceRandom` with some
 * identical `seed` will generate the same sequence of pseudo-random values.
 */
export interface InstanceRandom {
    /** The string used to initialize the pseudo-random data generator. */
    readonly seed: string;

    /**
     * Generates a pseudo-random integer within the given inclusive range.
     * @param min The minimum possible number (inclusive).
     * @param max The maximum possible number (exclusive).
     */
    int(min: number, max: number): number;

    /**
     * Generates a pseudo-random number between zero (inclusive) and one (exclusive).
     */
    decimal(): number;

    /**
     * Generates a string of pseudo-random characters (duplicate characters allowed).
     * @param length The length of the string to generate.
     * @param charset A string containing the characters to choose from when
     * generating the string. Duplicates are okay, but the charset must have at
     * least two unique characters. (Defaults to `Charsets.EXPANDED_CHARSET`)
     */
    string(length: number, charset?: string): string;

    /**
     * Returns a pseudo-random element from the given array without modifying anything.
     * @param array The array to select from.
     */
    choice<T>(array: T[]): T;

    /** Generates either `true` or `false` pseudo-randomly. */
    boolean(): boolean;
}
