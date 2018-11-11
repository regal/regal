export interface InstanceRandom {
    readonly seed: string;

    int(minInclusive: number, maxExclusive: number): number;

    decimal(): number;

    string(length: number, charset?: string);

    choice<T>(array: T[]): T;

    boolean(): boolean;
}
