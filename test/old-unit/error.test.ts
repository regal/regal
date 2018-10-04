import { expect } from "chai";
import "mocha";

import { RegalError } from "../../src/error";

describe("RegalError", function() {
    it("Construct a RegalError with a message", function() {
        expect(() => {
            throw new RegalError("Foo");
        }).to.throw(RegalError, "RegalError: Foo");
    });
});
