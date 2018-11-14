/**
 * Common charsets used for psuedo-random string generation.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

/**
 * Contains all letters (upper- and lower-case), numbers, and some special characters.
 * Used for psuedo-random string generation.
 */
export const EXPANDED_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+{}[]|;:<>,.?";

/**
 * Contains all letters (upper- and lower-case) and numbers.
 * Used for psuedo-random string generation.
 */
export const ALHPANUMERIC_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Contains all letters (upper- and lower-case).
 * Used for psuedo-random string generation.
 */
export const ALPHABET_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Contains all numbers.
 * Used for psuedo-random string generation.
 */
export const NUMBERS_CHARSET = "0123456789";
