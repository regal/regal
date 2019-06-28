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

    it("A forked PK provider generates keys just like the original would", function() {
        const original = buildPKProvider(RESERVED_KEYS);
        const pkFirst = original.next();
        const fork = original.fork();
        const pkOriginal = original.next();
        const pkFork = fork.next();

        expect(pkOriginal.equals(pkFork)).to.be.true;
        expect(pkFirst.plus(1).equals(pkFork)).to.be.true;
    });

    it("A forked PK's reserved keys are equivalent to the original", function() {
        const original = buildPKProvider(RESERVED_KEYS);
        const fork = original.fork();

        expect(
            original
                .reserved(RESERVED_KEYS.FOO)
                .equals(fork.reserved(RESERVED_KEYS.FOO))
        ).to.be.true;
    });

    it("Forking a PK provider has no effect on it", function() {
        const original = buildPKProvider();
        const firstPK = original.next();

        const fork = original.fork();
        fork.next();
        fork.next();
        fork.next();
        fork.fork().next(); // What do you eat soup with?

        expect(original.next().equals(firstPK.plus(1))).to.be.true;
    });

    it("Resetting a PK Provider with reserved and generated keys", function() {
        const prov = buildPKProvider(RESERVED_KEYS);
        const originalNext = prov.peek();

        prov.next();
        prov.next();
        prov.reset();

        expect(prov.peek().equals(originalNext)).to.be.true;
    });

    it("Resetting a PK Provider with no reserved keys", function() {
        const prov = buildPKProvider();
        const originalNext = prov.peek();

        prov.next();
        prov.next();
        prov.reset();

        expect(prov.peek().equals(originalNext)).to.be.true;
    });

    it("Resetting a PK Provider with no keys whatsoever", function() {
        const prov = buildPKProvider();
        const originalNext = prov.peek();
        prov.reset();
        expect(prov.peek().equals(originalNext)).to.be.true;
    });

    it("PKProvider.peek doesn't generate a key", function() {
        const prov = buildPKProvider();
        const peek = prov.peek();
        const next = prov.next();
        expect(peek.equals(next)).to.be.true;
    });

    it("A key generated after another will have a higher index", function() {
        const prov = buildPKProvider(RESERVED_KEYS);

        expect(prov.next().index()).to.be.lessThan(prov.next().index());
        expect(prov.next().index()).to.be.greaterThan(
            prov.reserved(RESERVED_KEYS.LARS).index()
        );
    });

    it("If a set of reserved keys is used to generate a PKProvider, the one with the lowest value will have an index of zero.", function() {
        const prov = buildPKProvider(RESERVED_KEYS);
        expect(prov.reserved(RESERVED_KEYS.FOO).index()).equals(0);
    });

    it("PKProvider.isPossibleKeyValue valid", function() {
        expect(buildPKProvider().isPossibleKeyValue("0")).to.be.true;
        expect(buildPKProvider().isPossibleKeyValue("123")).to.be.true;
    });

    it("PKProvider.isPossibleKeyValue invalid", function() {
        expect(buildPKProvider().isPossibleKeyValue("-1")).to.be.false;
        expect(buildPKProvider().isPossibleKeyValue("lars")).to.be.false;
        expect(buildPKProvider().isPossibleKeyValue(undefined)).to.be.false;
    });
});
