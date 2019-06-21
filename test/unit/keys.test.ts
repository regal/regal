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
    BAR: 2
};

describe("Keys", function() {
    it("Two reserved PKs from the same set are equal", function() {
        const prov = buildPKProvider(RESERVED_KEYS);

        const foo1 = prov.reserved(RESERVED_KEYS.FOO);
        const foo2 = prov.reserved(RESERVED_KEYS.FOO);

        expect(foo1.equals(foo2)).to.be.true;
    });
});
