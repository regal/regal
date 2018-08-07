import { expect } from 'chai';
import 'mocha';

import { GameInstance, RegalError } from '../src/game';
import { on, noop } from '../src/event';

describe("Event", function() {

    it("The `on` function does not alter the inner event function", function() {
        const greet = on("GREET", game => {
            game.output.write("Hello, world!");
            return noop;
        });

        const myGame = new GameInstance();
        greet(myGame);

        expect(myGame.output.lines).to.deep.equal(["Hello, world!"]);
    });

});