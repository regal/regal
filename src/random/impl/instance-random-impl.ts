import Prando from "prando";
import { RegalError } from "../../error";
import { GameInstance } from "../../state";
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
        this._numGenerations++;
        return this._generator.nextInt(min, max);
    }

    public decimal(): number {
        this._numGenerations++;
        return this._generator.next(0, 1);
    }

    public string(
        length: number,
        charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    ) {
        this._numGenerations++;
        return this._generator.nextString(length, charset);
    }

    public choice<T>(array: T[]): T {
        this._numGenerations++;
        return this._generator.nextArrayItem(array);
    }

    public boolean(): boolean {
        this._numGenerations++;
        return this._generator.nextBoolean();
    }
}
