/*
 * Contains interfaces for the Game Library's primary key system.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export interface PK<T> {
    plus(n: number): PK<T>;
    minus(n: number): PK<T>;
    equals(key: PK<T> | FK<T>): boolean;
    ref(key: PK<T> | FK<T>): boolean;
    value(): string;
}

export interface ReservedPKSet<T> {
    [key: string]: number;
}

export interface PKProvider<T> {
    next(): PK<T>;
    fork(): PKProvider<T>;
    reserved(key: number): PK<T>;
}

export interface FK<T> extends PK<T> {}
