import { expect } from "chai";
import "mocha";

import GameInstance from "../../src/game-instance";
import { MetadataManager } from "../../src/config";
import { getDemoMetadata } from "../test-utils";
import { Game } from "../../src/api";
import { RegalError } from "../../src/error";

// Note: Some tests for GameInstance.using are in agents.test.ts

describe("GameInstance", function() {
    beforeEach(function() {
        Game.reset();
        MetadataManager.setMetadata(getDemoMetadata());
        Game.init();
    });

    it("Sanity check", function() {
        const myGame = new GameInstance();
        let game2 = myGame;

        expect(myGame).to.equal(game2);
        expect(myGame).to.not.equal(new GameInstance());
        expect(myGame).to.deep.equal(new GameInstance());
    });

    it("Cycling a new GameInstance is equivalent to instantiating a new one", function() {
        const game = new GameInstance();
        expect(game.recycle()).to.deep.equal(new GameInstance());
    });

    it("A cycled GameInstance is not equal to its former instance", function() {
        const former = new GameInstance();
        const current = former.recycle();

        expect(former).to.not.equal(current);
    });

    it("Cycling a game instance copies its options", function() {
        const former = new GameInstance({
            debug: true
        });
        const current = former.recycle();

        expect(former.options).to.not.equal(current.options);
        expect(current.options).to.deep.equal(former.options);
    });

    it("Throw an error if a GameInstance is instantiated in the static context", function() {
        Game.reset();

        expect(() => new GameInstance()).to.throw(
            RegalError,
            "Cannot construct a GameInstance outside of a game cycle."
        );
    });

    it("Throw an error if GameInstance.using is called with undefined", function() {
        expect(() => new GameInstance().using(undefined)).to.throw(
            RegalError,
            "Resource must be defined"
        );
    });

    it("Throw an error if GameInstance.using is called with an illegal object", function() {
        expect(() => new GameInstance().using({ foo: "bar" })).to.throw(
            RegalError,
            "Invalid agent in resource at key <foo>."
        );
    });

    it("GameInstance.using only references properties on the resource object itself", function() {
        class WeirdResource {}
        (WeirdResource as any).prototype.foo = "bar";

        const game = new GameInstance();
        expect("foo" in game.using(new WeirdResource())).to.be.false;
    });
});
