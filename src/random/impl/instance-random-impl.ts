import Prando from "prando";
import { RegalError } from "../../error";
import { GameInstance } from "../../state";
import { EXPANDED_CHARSET } from "../charsets";
import { InstanceRandom } from "../instance-random";

export const buildInstanceRandom = (
    game: GameInstance,
    numGenerations: number = 0
): InstanceRandom => new InstanceRandomImpl(game, numGenerations);

class InstanceRandomImpl implements InstanceRandom {
    private _numGenerations: number;
    private _generator: Prando;

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

    public get seed() {
        return this.game.options.seed;
    }

    public get numGenerations() {
        return this._numGenerations;
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

        if (charset.length < 2) {
            throw new RegalError(
                `Charset <${charset}> must be at least two characters long.`
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
