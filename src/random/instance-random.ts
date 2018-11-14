/**
 * Contains the interface to the random component.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { GameInstance } from "../state";

/**
 * API to generate deterministic, psuedo-random data for the game instance.
 *
 * The data is considered deterministic because any `InstanceRandom` with an
 * equal `seed` will generate the same sequence of psuedo-random values.
 */
export interface InstanceRandom {
    /** The `GameInstance` that manages this `InstanceRandom`. */
    readonly game: GameInstance;

    /** The string used to initialize the psuedo-random data generator. */
    readonly seed: string;

    /**
     * The number of values that have been generated over the lifetime of the game.
     *
     * This value is persisted between multiple game cycles so as to ensure that the
     * sequence of psuedo-random data stays consistent for a given seed.
     */
    readonly numGenerations: number;

    /**
     * Generates a psuedo-random integer within the given inclusive range.
     * @param min The minimum possible number (inclusive).
     * @param max The maximum possible number (exclusive).
     */
    int(min: number, max: number): number;

    /**
     * Generates a psuedo-random number between zero (inclusive) and one (exclusive).
     */
    decimal(): number;

    /**
     * Generates a string of random characters (duplicate characters allowed).
     * @param length The length of the string to generate.
     * @param charset A string containing the characters to choose from when
     * generating the string. Must be at least two characters long.
     */
    string(length: number, charset?: string);

    choice<T>(array: T[]): T;

    boolean(): boolean;
}
