import { expect } from "chai";
import "mocha";

import GameInstance from "../src/game-instance";
import { MetadataManager } from "../src/config";
import { getDemoMetadata } from "./test-utils";

describe("GameInstance", function() {
    beforeEach(function() {
        MetadataManager.setMetadata(getDemoMetadata());
    });

    afterEach(function() {
        MetadataManager.reset();
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
        expect(game.cycle()).to.deep.equal(new GameInstance());
    });

    it("A cycled GameInstance is not equal to its former instance", function() {
        const former = new GameInstance();
        const current = former.cycle();

        expect(former).to.not.equal(current);
    });

    it("Cycling a game instance copies its options", function() {
        const former = new GameInstance({
            debug: true
        });
        const current = former.cycle();

        expect(former.options).to.not.equal(current.options);
        expect(current.options).to.deep.equal(former.options);
    });
});
