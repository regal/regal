import { expect } from 'chai';
import 'mocha';

import GameInstance from '../src/game-instance';

describe("GameInstance", function() {

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
});