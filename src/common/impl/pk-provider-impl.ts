/*
 * Contains the current implementation of `PKProvider`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../../error";
import { PK, PKProvider, ReservedPKSet } from "../keys";

export class PKProviderImpl<PKClass> implements PKProvider<PKClass> {
    public static readonly START_VALUE = 0;

    /**
     * Builds a `PKProvider`.
     * @param buildPK The abstracted `PK` build function. Assumes that `PK` accepts a number for its internal value.
     * @param reservedKeys Any reserved keys.
     */
    public static build<T>(
        buildPK: (internalValue: number) => PK<T>,
        reservedKeys: ReservedPKSet<T> = {}
    ): PKProviderImpl<T> {
        let lastPK = buildPK(PKProviderImpl.START_VALUE);

        const sortedValues = Object.keys(reservedKeys)
            .map(key => reservedKeys[key])
            .sort((a, b) => a - b);

        if (sortedValues.length === 0) {
            return new PKProviderImpl(buildPK, lastPK);
        }

        const reservedPKs = {};

        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        const range = max - min;

        if (range !== sortedValues.length - 1) {
            throw new RegalError(
                "reservedKeys must be a continuous range of numbers, with no missing or duplicate values."
            );
        }

        reservedPKs[sortedValues[0]] = lastPK;

        for (let i = 1; i < sortedValues.length; i++) {
            lastPK = lastPK.plus(1);
            reservedPKs[sortedValues[i]] = lastPK;
        }

        return new PKProviderImpl(buildPK, lastPK, reservedPKs);
    }

    constructor(
        private buildPK: (internalValue: number) => PK<PKClass>,
        private lastPK: PK<PKClass>,
        private reservedPKs: { [key: string]: PK<PKClass> } = {}
    ) {}

    public next(): PK<PKClass> {
        this.lastPK = this.lastPK.plus(1);
        return this.lastPK;
    }

    public fork(): PKProvider<PKClass> {
        return new PKProviderImpl(this.buildPK, this.lastPK, this.reservedPKs);
    }

    public reserved(key: number): PK<PKClass> {
        const pk = this.reservedPKs[key];
        if (!pk) {
            throw new RegalError(
                `No reserved PK exists with the reserved key ${key}.`
            );
        }
        return pk;
    }

    public reset(): void {
        const defaultPK = this.buildPK(PKProviderImpl.START_VALUE);
        if (this.lastPK.equals(defaultPK)) {
            return;
        }

        const sortedPKs = Object.keys(this.reservedPKs)
            .map(key => this.reservedPKs[key])
            .sort((a, b) => a.index() - b.index());

        if (sortedPKs.length === 0) {
            this.lastPK = defaultPK;
            return;
        }

        this.lastPK = sortedPKs[sortedPKs.length - 1];
    }

    public peek(): PK<PKClass> {
        return this.lastPK.plus(1);
    }

    public isPossibleKeyValue(str: string): boolean {
        const tryNum = Math.floor(Number(str));
        return (
            tryNum !== Infinity &&
            String(tryNum) === str &&
            tryNum >= PKProviderImpl.START_VALUE
        );
    }

    public countGenerated(): number {
        return this.lastPK.index();
    }

    public forkAfterKey(key: PK<PKClass>): PKProvider<PKClass> {
        return new PKProviderImpl(this.buildPK, key, this.reservedPKs);
    }

    public previous(): PK<PKClass> {
        return this.lastPK;
    }

    public keyFromValue(value: string): PK<PKClass> {
        if (!this.isPossibleKeyValue(value)) {
            throw new RegalError(`${value} is not a valid PK value.`);
        }

        return this.buildPK(Math.floor(Number(value)));
    }
}
