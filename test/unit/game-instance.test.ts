import { expect } from "chai";
import "mocha";

import { getDemoMetadata, Dummy, makeAgents } from "../test-utils";
import { Game } from "../../src/api";
import { RegalError } from "../../src/error";
import { buildGameInstance } from "../../src/state";
import { on } from "../../src/events";

describe("GameInstance", function() {
    beforeEach(function() {
        Game.reset();
        Game.init(getDemoMetadata());
    });

    it("Sanity check", function() {
        const myGame = buildGameInstance({ seed: "foo" });
        let game2 = myGame;

        expect(myGame).to.equal(game2);
        expect(myGame).to.not.equal(buildGameInstance({ seed: "foo" }));
        expect(myGame).to.deep.equal(buildGameInstance({ seed: "foo" }));
    });

    it("Throw an error if a GameInstance is instantiated in the static context", function() {
        Game.reset();

        expect(() => buildGameInstance()).to.throw(
            RegalError,
            "Cannot construct a GameInstance outside of a game cycle."
        );
    });

    describe("Recycle", function() {
        it("Cycling a new GameInstance is equivalent to instantiating a new one", function() {
            const game = buildGameInstance({ seed: "foo" });
            expect(game.recycle()).to.deep.equal(
                buildGameInstance({ seed: "foo" })
            );
        });

        it("A cycled GameInstance is not equal to its former instance", function() {
            const former = buildGameInstance();
            const current = former.recycle();

            expect(former).to.not.equal(current);
        });

        it("Cycling a game instance copies its options", function() {
            const former = buildGameInstance({
                debug: true,
                seed: "foo"
            });
            const current = former.recycle();

            expect(former.options).to.not.equal(current.options);
            expect(current.options).to.deep.equal(former.options);
        });
    });

    describe("Using", function() {
        // Note: Many tests for GameInstance.using are in agents.test.ts

        it("Throw an error if GameInstance.using is called with undefined", function() {
            expect(() => buildGameInstance().using(undefined)).to.throw(
                RegalError,
                "Resource must be defined"
            );
        });

        it("Throw an error if GameInstance.using is called with an illegal object", function() {
            expect(() => buildGameInstance().using({ foo: "bar" })).to.throw(
                RegalError,
                "Invalid agent in resource at key <foo>."
            );
        });

        it("GameInstance.using only references properties on the resource object itself", function() {
            class WeirdResource {}
            (WeirdResource as any).prototype.foo = "bar";

            const game = buildGameInstance();
            expect("foo" in game.using(new WeirdResource())).to.be.false;
        });
    });

    describe("Revert", function() {
        it("Reverting the effects of many events back to the first one", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
            });

            const mod = (num: number) =>
                on(`MOD ${num}`, game => {
                    game.state.foo += `-${num}`;
                    game.state[num] = `Yo ${num}`;
                });

            let myGame = buildGameInstance({ trackAgentChanges: true });
            init(myGame);

            for (let x = 0; x < 10; x++) {
                mod(x)(myGame);
            }

            expect(myGame.state.foo).to.equal(
                "Hello, world!-0-1-2-3-4-5-6-7-8-9"
            );
            expect(myGame.state[0]).to.equal("Yo 0");
            expect(myGame.state[5]).to.equal("Yo 5");
            expect(myGame.state[9]).to.equal("Yo 9");

            myGame = myGame.revert(1);

            expect(myGame.state.foo).to.equal("Hello, world!");
            expect(myGame.state[0]).to.be.undefined;
            expect(myGame.state[5]).to.be.undefined;
            expect(myGame.state[9]).to.be.undefined;
        });

        it("Reverting the effects of many events to different points in time", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
            });

            const mod = (num: number) =>
                on(`MOD ${num}`, game => {
                    game.state.foo += `-${num}`;
                    game.state[num] = `Yo ${num}`;
                });

            const myGame = buildGameInstance({ trackAgentChanges: true });
            init(myGame);

            for (let x = 0; x < 10; x++) {
                mod(x)(myGame);
            }

            expect(myGame.state.foo).to.equal(
                "Hello, world!-0-1-2-3-4-5-6-7-8-9"
            );
            expect(myGame.state[0]).to.equal("Yo 0");
            expect(myGame.state[5]).to.equal("Yo 5");
            expect(myGame.state[9]).to.equal("Yo 9");

            const g1 = myGame.revert(8);

            expect(g1.state.foo).to.equal("Hello, world!-0-1-2-3-4-5-6");
            expect(g1.state[0]).to.equal("Yo 0");
            expect(g1.state[5]).to.equal("Yo 5");
            expect(g1.state[9]).to.be.undefined;

            const g2 = myGame.revert(6);

            expect(g2.state.foo).to.equal("Hello, world!-0-1-2-3-4");
            expect(g2.state[0]).to.equal("Yo 0");
            expect(g2.state[5]).to.be.undefined;
            expect(g2.state[9]).to.be.undefined;

            const g3 = myGame.revert(4);

            expect(g3.state.foo).to.equal("Hello, world!-0-1-2");
            expect(g3.state[0]).to.equal("Yo 0");
            expect(g3.state[5]).to.be.undefined;
            expect(g3.state[9]).to.be.undefined;

            const g4 = myGame.revert(1);

            expect(g4.state.foo).to.equal("Hello, world!");
            expect(g4.state[0]).to.be.undefined;
            expect(g4.state[5]).to.be.undefined;
            expect(g4.state[9]).to.be.undefined;
        });

        it("Reverting to before an agent was registered", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
                game.state.dummy = new Dummy("Lars", 10);
            });

            let myGame = buildGameInstance();
            init(myGame);
            myGame = myGame.revert(0);

            expect(myGame.state.foo).to.be.undefined;
            expect(myGame.state.dummy).to.be.undefined;
            expect(myGame.agents.getAgentProperty(1, "name")).to.be.undefined;
            expect(myGame.agents.getAgentProperty(1, "health")).to.be.undefined;
        });

        it("Reverting changes to static agents", function() {
            Game.reset();
            const staticDummy = new Dummy("Lars", 15);
            Game.init(getDemoMetadata());

            let myGame = buildGameInstance();
            on("FUNC", game => {
                const dummy = game.using(staticDummy);
                dummy.name = "Jimbo";
                dummy["bippity"] = "boppity";
            })(myGame);

            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Jimbo");
            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(15);
            expect(myGame.agents.getAgentProperty(1, "bippity")).to.equal(
                "boppity"
            );

            myGame = myGame.revert();

            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Lars");
            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(15);
            expect(myGame.agents.getAgentProperty(1, "bippity")).to.be
                .undefined;
        });

        it("Reverting changes to an agent array through the Game API", function() {
            const myGame = buildGameInstance();
            myGame.state.agents = makeAgents(0, 6);

            expect(myGame.state.agents.length).to.equal(6);
            expect(myGame.state.agents[0].name).to.equal("D0");
            expect(myGame.state.agents[5].name).to.equal("D5");

            on("REVERSE", game => {
                const agents = myGame.state.agents as Dummy[];
                agents.reverse();
            })(myGame);

            expect(myGame.state.agents.length).to.equal(6);
            expect(myGame.state.agents[0].name).to.equal("D5");
            expect(myGame.state.agents[5].name).to.equal("D0");

            const res = Game.postUndoCommand(myGame).instance;

            expect(res.state.agents.length).to.equal(6);
            expect(res.state.agents[0].name).to.equal("D0");
            expect(res.state.agents[5].name).to.equal("D5");
        });
    });
});
