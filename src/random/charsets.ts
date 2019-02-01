/*
 * Common charsets used for pseudo-random string generation.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Contains all letters (upper- and lower-case), numbers, and some special characters.
 * Used for pseudo-random string generation.
 */
export const EXPANDED_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()-_=+{}[]|;:<>,.?";

/**
 * Contains all letters (upper- and lower-case) and numbers.
 * Used for pseudo-random string generation.
 */
export const ALHPANUMERIC_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Contains all letters (upper- and lower-case).
 * Used for pseudo-random string generation.
 */
export const ALPHABET_CHARSET =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Contains all numbers.
 * Used for pseudo-random string generation.
 */
export const NUMBERS_CHARSET = "0123456789";
