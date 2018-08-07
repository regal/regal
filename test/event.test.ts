import { expect } from 'chai';
import 'mocha';

import { GameInstance, RegalError } from '../src/game';
import { on, noop } from '../src/event';
import { log } from '../src/utils';

describe("Event", function() {

    it("The `on` function does not alter the inner event function", function() {
        const greet = on("GREET", game => {
            game.output.write("Hello, world!");
            return noop;
        });

        const myGame = new GameInstance();
        greet(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: 1,
                name: "GREET",
                output: [
                    "Hello, world!"
                ]
            }
        ]);
        expect(myGame.output.lines).to.deep.equal(["Hello, world!"]);
    });

    it("Partial application and name templating with `on`", function() {
        const greet = (name: string) =>
            on(`GREET <${name}>`, game => {
                game.output.write(`Hello, ${name}!`);
                return noop;
            });

        const myGame = new GameInstance();
        greet("Regal")(myGame);

        expect(myGame.events.history).to.deep.equal([
            {
                id: 1,
                name: "GREET <Regal>",
                output: [
                    "Hello, Regal!"
                ]
            }
        ]);
        expect(myGame.output.lines).to.deep.equal(["Hello, Regal!"]);
    });

});