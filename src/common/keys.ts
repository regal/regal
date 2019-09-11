/*
 * Contains interfaces for the Game Library's primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

/**
 * Primary key for an indexed class, a class of which there
 * are many instances that each need a unique identifier.
 *
 * @template T The class referenced by this primary key type - i.e. `AgentId`
 */
export interface PK<T> {
    /**
     * Generates the primary key that would be generated `n` keys
     * after this one. The result of this function should never be
     * used to assign a key to an object. It's only for comparison.
     */
    plus(n: number): PK<T>;

    /**
     * Generates the primary key that would be generated `n` keys
     * before this one. The result of this function should never be
     * used to assign a key to an object. It's only for comparison.
     */
    minus(n: number): PK<T>;

    /** Whether this key is equivalent to the given one. */
    equals(key: PK<T>): boolean;

    /** Generates a foreign key that references this key. */
    ref(): FK<PK<T>>;

    /**
     * Generates a string value representative of this key.
     * This is used for the `equals` method, which is strongly preferred
     * for testing the equality of two keys.
     */
    value(): string;

    /**
     * Returns the placement of this key in the list of all keys.
     * For example, an index of 2 means this was the second key generated.
     *
     * This includes reserved keys; if a set of reserved keys was used
     * to generate this key's `PKProvider`, the entry with the lowest value
     * will have an index of 0.
     */
    index(): number;
}

/**
 * A set of reserved keys for an indexed class. The values of the keys
 * in a set don't need to be in order, but the values must make up a
 * continuous range of numbers with no missing or duplicate elements.
 *
 * @template T The class referenced by this primary key type.
 */
export interface ReservedPKSet<T> {
    [key: string]: number;
}

/**
 * A generator for primary keys. The provider is the single source
 * of truth for all primary keys of a given class. Requesting keys
 * from a `PKProvider` is the only way to ensure no duplicate keys
 * are generated by mistake.
 *
 * @template T The class of primary key provided by this provider.
 */
export interface PKProvider<T> {
    /** Generates a unique `PK`. */
    next(): PK<T>;

    /**
     * Creates a copy of the `PKProvider`. The new provider maintains
     * the same references to any reserved keys and the keys generated
     * up to this point, but after that the link is severed. If you
     * continue generating keys from both the old and new providers, there
     * will almost certainly be duplicates.
     */
    fork(): PKProvider<T>;

    /**
     * Retrieves the primary key associated with an entry of the reserved
     * set that was used to create the provider. It's best to compare reserved
     * keys generated through this method rather than comparing entries in the
     * original set, as this method performs validation.
     */
    reserved(key: number): PK<T>;

    /**
     * Resets the `PKProvider`'s internal `PK` generator back to its start value.
     * Any reserved keys used to generate this `PKProvider` will remain.
     */
    reset(): void;

    /**
     * Provides the `PK` that would be generated by `PKProvider.next()` without
     * incrementing the internal key generator.
     */
    peek(): PK<T>;

    /**
     * Determines whether the given string could be the value of a `PK` generated
     * by this `PKProvider`. Note that this makes no guarantee that this `PK` was
     * actually generated.
     */
    isPossibleKeyValue(str: string): boolean;

    /**
     * Returns the number of keys generated by this `PKProvider`.
     */
    countGenerated(): number;

    /**
     * Creates a new fork of the `PKProvider` which behaves as if `key` was the
     * last key generated by it.
     */
    forkAfterKey(key: PK<T>): PKProvider<T>;

    /** Returns the key that was last generated. */
    previous(): PK<T>;

    keyFromValue(value: string): PK<T>;
}

/**
 * A foreign key, which is a reference to another object's primary key.
 *
 * @template T The class referenced by this foreign key type.
 */
export interface FK<T extends PK<any>> extends PK<T> {}
