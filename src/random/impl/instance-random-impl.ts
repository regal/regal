/*
 * Contains the current implementation of `InstanceRandom`.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import Prando from "prando";
import { buildPKProvider, PKProvider } from "../../common";
import { RegalError } from "../../error";
import { GameInstanceInternal } from "../../state";
import { EXPANDED_CHARSET } from "../charsets";
import { InstanceRandomInternal } from "../instance-random-internal";
import { RandomRecord } from "../random-record";

/**
 * Constructs an `InstanceRandom` using the current implementation.
 * @param game The managing `GameInstance`.
 * @param pkProvider The existing random PK provider (optional).
 */
export const buildInstanceRandom = (
    game: GameInstanceInternal,
    pkProvider?: PKProvider<RandomRecord>
): InstanceRandomInternal => new InstanceRandomImpl(game, pkProvider);

class InstanceRandomImpl implements InstanceRandomInternal {
    private _generator: Prando;

    /** The internal `RandomRecord` `PKProvider`. */
    private _pkProvider: PKProvider<RandomRecord>;

    public get seed() {
        return this.game.options.seed;
    }

    public get numGenerations() {
        return this._pkProvider.countGenerated();
    }

    public get lastKey() {
        return this._pkProvider.previous();
    }

    constructor(
        public game: GameInstanceInternal,
        pkProvider: PKProvider<RandomRecord>
    ) {
        if (this.seed === undefined) {
            throw new RegalError(
                "Seed must be defined before an InstanceRandom can be constructed."
            );
        }

        this._pkProvider = pkProvider ? pkProvider : buildPKProvider();
        this._generator = new Prando(this.seed);
        this._generator.skip(this.numGenerations);
    }

    public recycle(newInstance: GameInstanceInternal): InstanceRandomInternal {
        return new InstanceRandomImpl(newInstance, this._pkProvider);
    }

    public int(min: number, max: number): number {
        if (min > max) {
            throw new RegalError(
                `Min <${min}> must be less than or equal to max <${max}>.`
            );
        }

        const value = this._generator.nextInt(min, max);
        this.trackRandom(value);

        return value;
    }

    public decimal(): number {
        const value = this._generator.next(0, 1);
        this.trackRandom(value);
        return value;
    }

    public string(length: number, charset: string = EXPANDED_CHARSET) {
        if (length <= 0) {
            throw new RegalError(
                `Length <${length}> must be greater than zero.`
            );
        }

        if (new Set(charset).size < 2) {
            throw new RegalError(
                `Charset <${charset}> must have at least two unique characters.`
            );
        }

        const value = this._generator.nextString(length, charset);
        this.trackRandom(value);

        return value;
    }

    public choice<T>(array: T[]): T {
        if (array === undefined) {
            throw new RegalError("Array must be defined.");
        }

        const idx = this._generator.nextInt(0, array.length - 1);
        this.trackRandom(idx); // Track the index of the selected element, rather than the element itself

        return array[idx];
    }

    public boolean(): boolean {
        const value = this._generator.nextBoolean();
        this.trackRandom(value);
        return value;
    }

    /** Internal helper method to add the `RandomRecord` to the current `EventRecord`. */
    private trackRandom(value: string | number | boolean): void {
        this.game.events.current.trackRandom({
            id: this._pkProvider.next(),
            value
        });
    }
}
