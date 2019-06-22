import { expect } from "chai";
import "mocha";

import {
    FK,
    ReservedPKSet,
    PKProvider,
    buildPKProvider
} from "../../src/common";

interface Dummy {}
const RESERVED_KEYS: ReservedPKSet<Dummy> = {
    FOO: 1,
    BAR: 2,
    LARS: 3
};

describe("Keys", function() {
    it("A reserved key set is not required for a provider", function() {
        const prov = buildPKProvider();
        prov.next();
    });

    it("A generated key equals itself", function() {
        const prov = buildPKProvider();
        const key = prov.next();
        expect(key.equals(key)).to.be.true;
    });

    it("Two generated keys are not equal", function() {
        const prov = buildPKProvider();
        const key1 = prov.next();
        const key2 = prov.next();

        expect(key1.equals(key2)).to.be.false;
    });

    it("Plus/minus 1 to a generated key makes it equal to those directly before and after", function() {
        const prov = buildPKProvider();
        const [key1, key2, key3] = [prov.next(), prov.next(), prov.next()];

        expect(key1.equals(key2.minus(1)));
        expect(key2.minus(1).equals(key1));
        expect(key3.equals(key2.plus(1)));
        expect(key2.plus(1).equals(key3));
    });

    it("Plus/minus works for numbers greater than one", function() {
        const prov = buildPKProvider();
        const key1 = prov.next();

        for (let i = 0; i < 5; i++) {
            prov.next();
        }

        const key7 = prov.next();

        expect(key1.plus(6).equals(key7)).to.be.true;
        expect(key7.minus(6).equals(key1)).to.be.true;
    });

    it("Two of the same reserved PK are equal", function() {
        const prov = buildPKProvider(RESERVED_KEYS);

        const foo1 = prov.reserved(RESERVED_KEYS.FOO);
        const foo2 = prov.reserved(RESERVED_KEYS.FOO);

        expect(foo1.equals(foo2)).to.be.true;
    });

    it("Reserved keys plus/minus comparisons work logically", function() {
        const prov = buildPKProvider(RESERVED_KEYS);

        const foo = prov.reserved(RESERVED_KEYS.FOO);
        const bar = prov.reserved(RESERVED_KEYS.BAR);
        const lars = prov.reserved(RESERVED_KEYS.LARS);

        expect(foo.plus(1).equals(bar));
        expect(bar.equals(lars.minus(1)));
        expect(foo.plus(2).equals(lars));
        expect(lars.minus(2).equals(foo));
    });

    it("Reserved keys must be a continuous set", function() {
        expect(() => {
            buildPKProvider({
                BAD: 1,
                NEWS: 3
            });
        }).to.throw(
            "reservedKeys must be a continuous range of numbers, with no missing or duplicate values."
        );
    });

    it("Reserved keys cannot have duplicates", function() {
        expect(() => {
            buildPKProvider({
                BAD: 1,
                NEWS: 1
            });
        }).to.throw(
            "reservedKeys must be a continuous range of numbers, with no missing or duplicate values."
        );
    });

    it("Reserved keys don't have to be declared in order, and position is relative", function() {
        const crazyKeys = {
            WOAH: 5040,
            DUDE: 5039,
            BIG: 5037,
            NUMBERS: 5038
        };
        const prov = buildPKProvider(crazyKeys);

        const woah = prov.reserved(crazyKeys.WOAH);
        const big = prov.reserved(crazyKeys.BIG);

        expect(big.plus(3).equals(woah)).to.be.true;
    });

    it("Throws an error if you try to get a non-existent reserved key", function() {
        const prov = buildPKProvider(RESERVED_KEYS);
        expect(() => prov.reserved(212)).to.throw(
            "No reserved PK exists with the reserved key 212."
        );
    });

    it("PK.ref() creates an equivalent key", function() {
        const prov = buildPKProvider(RESERVED_KEYS);
        const pk = prov.next();
        const fk = pk.ref();
        expect(pk.equals(fk));
        expect(pk.plus(1).equals(fk.plus(1))).to.be.true;
    });
});