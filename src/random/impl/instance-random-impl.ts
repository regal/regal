/*
 * Contains the current implementation of `InstanceRandom`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import Prando from "prando";
import { RegalError } from "../../error";
import { GameInstance } from "../../state";
import { EXPANDED_CHARSET } from "../charsets";
import { InstanceRandomInternal } from "../instance-random-internal";

/**
 * Constructs an `InstanceRandom` using the current implementation.
 * @param game The managing `GameInstance`.
 * @param numGenerations The number of generations to start from.
 * Defaults to zero.
 */
export const buildInstanceRandom = (
    game: GameInstance,
    numGenerations: number = 0
): InstanceRandomInternal => new InstanceRandomImpl(game, numGenerations);

class InstanceRandomImpl implements InstanceRandomInternal {
    private _numGenerations: number;
    private _generator: Prando;

    public get seed() {
        return this.game.options.seed;
    }

    public get numGenerations() {
        return this._numGenerations;
    }

    constructor(public game: GameInstance, numGenerations: number) {
        if (this.seed === undefined) {
            throw new RegalError(
                "Seed must be defined before an InstanceRandom can be constructed."
            );
        }

        this._numGenerations = numGenerations;
        this._generator = new Prando(this.seed);
        this._generator.skip(numGenerations);
    }

    public recycle(newInstance: GameInstance): InstanceRandomInternal {
        return new InstanceRandomImpl(newInstance, this.numGenerations);
    }

    public int(min: number, max: number): number {
        if (min > max) {
            throw new RegalError(
                `Min <${min}> must be less than or equal to max <${max}>.`
            );
        }

        this._numGenerations++;
        return this._generator.nextInt(min, max);
    }

    public decimal(): number {
        this._numGenerations++;
        return this._generator.next(0, 1);
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

        this._numGenerations++;
        return this._generator.nextString(length, charset);
    }

    public choice<T>(array: T[]): T {
        if (array === undefined) {
            throw new RegalError("Array must be defined.");
        }

        this._numGenerations++;
        return this._generator.nextArrayItem(array);
    }

    public boolean(): boolean {
        this._numGenerations++;
        return this._generator.nextBoolean();
    }
}
