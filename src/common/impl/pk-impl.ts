import { FK, PK } from "../keys";

export class PKImpl<T> implements PK<T> {
    constructor(private internalValue: number) {}

    public plus(n: number): PK<T> {
        throw new Error("Method not implemented.");
    }

    public minus(n: number): PK<T> {
        throw new Error("Method not implemented.");
    }

    public equals(key: PK<T> | FK<T>): boolean {
        throw new Error("Method not implemented.");
    }

    public ref(key: PK<T> | FK<T>): boolean {
        throw new Error("Method not implemented.");
    }

    public value(): string {
        throw new Error("Method not implemented.");
    }
}
