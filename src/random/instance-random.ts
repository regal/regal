import { GameInstance } from "../state";

export interface InstanceRandom {
    readonly game: GameInstance;

    readonly seed: string;

    readonly numGenerations: number;

    int(min: number, max: number): number;

    decimal(): number;

    string(length: number, charset?: string);

    choice<T>(array: T[]): T;

    boolean(): boolean;
}
