import { RegalError } from "../../error";
import { PK, PKProvider, ReservedPKSet } from "../keys";

export class PKProviderImpl<PKClass> implements PKProvider<PKClass> {
    public static readonly START_VALUE = 0;

    private reservedPKs: { [key: string]: PK<PKClass> } = {};
    private lastPK: PK<PKClass>;

    constructor(
        private buildPK: (internalValue: number) => PK<PKClass>,
        reservedKeys: ReservedPKSet<PKClass> = {}
    ) {
        this._generateReservedPKs(reservedKeys);
    }

    public next(): PK<PKClass> {
        this.lastPK = this.lastPK.plus(1);
        return this.lastPK;
    }

    public fork(): PKProvider<PKClass> {
        throw new Error("Method not implemented.");
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

    private _generateReservedPKs(reservedKeys: ReservedPKSet<PKClass>) {
        let lastPK = this.buildPK(PKProviderImpl.START_VALUE);

        const sortedValues = Object.keys(reservedKeys)
            .map(key => reservedKeys[key])
            .sort();

        if (sortedValues.length === 0) {
            this.lastPK = lastPK;
            return;
        }

        const min = sortedValues[0];
        const max = sortedValues[sortedValues.length - 1];
        const range = max - min;

        if (range !== sortedValues.length - 1) {
            throw new RegalError(
                "reservedKeys must be a continuous range of numbers, with no missing or duplicate values."
            );
        }

        this.reservedPKs[sortedValues[0]] = lastPK;

        for (let i = 1; i < sortedValues.length; i++) {
            lastPK = lastPK.plus(1);
            this.reservedPKs[sortedValues[i]] = lastPK;
        }

        this.lastPK = lastPK;
    }
}
