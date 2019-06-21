import { PK, PKProvider, ReservedPKSet } from "../keys";

export class PKProviderImpl<T> implements PKProvider<T> {
    constructor(private reservedKeys: ReservedPKSet<T>) {}

    public next(): PK<T> {
        throw new Error("Method not implemented.");
    }

    public fork(): PKProvider<T> {
        throw new Error("Method not implemented.");
    }

    public reserved(key: number): PK<T> {
        throw new Error("Method not implemented.");
    }
}
