import { FK, PK } from "../keys";

export class NumericPKImpl<T> implements PK<T> {
    constructor(private internalValue: number) {}

    public plus(n: number): PK<T> {
        return new NumericPKImpl(this.internalValue + n);
    }

    public minus(n: number): PK<T> {
        return new NumericPKImpl(this.internalValue - n);
    }

    public equals(key: PK<T> | FK<T>): boolean {
        return this === key || this.value() === key.value();
    }

    public ref(): FK<T> {
        return this;
    }

    public value(): string {
        return String(this.internalValue);
    }
}
