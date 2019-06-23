import { RegalError } from "../../error";
import { PK, PKProvider, ReservedPKSet } from "../keys";

export class PKProviderImpl<PKClass> implements PKProvider<PKClass> {
    public static readonly START_VALUE = 0;

    public static build<T>(
        buildPK: (internalValue: number) => PK<T>,
        reservedKeys: ReservedPKSet<T> = {}
    ): PKProviderImpl<T> {
        let lastPK = buildPK(PKProviderImpl.START_VALUE);

        const sortedValues = Object.keys(reservedKeys)
            .map(key => reservedKeys[key])
            .sort();

        if (sortedValues.length === 0) {
            return new PKProviderImpl(lastPK);
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

        return new PKProviderImpl(lastPK, reservedPKs);
    }

    constructor(
        private lastPK: PK<PKClass>,
        private reservedPKs: { [key: string]: PK<PKClass> } = {}
    ) {}

    public next(): PK<PKClass> {
        this.lastPK = this.lastPK.plus(1);
        return this.lastPK;
    }

    public fork(): PKProvider<PKClass> {
        return new PKProviderImpl(this.lastPK, this.reservedPKs);
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
}
