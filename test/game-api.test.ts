import { expect } from "chai";
import "mocha";

import { Game, GameResponse, resetGame } from "../src/game-api";
import { onPlayerCommand, onStartCommand } from "../src/api-hooks";
import { noop } from "../src/events";
import GameInstance from "../src/game-instance";
import { OutputLineType } from "../src/output";
import { log } from "./utils";
import { Agent } from "../src/agents";

describe("Game API", function() {
    beforeEach(function() {
        resetGame();
    });

    describe("Game.postPlayerCommand", function() {
        it("Sending a good request sends the correct output", function() {
            onPlayerCommand(command => game => {
                game.output.write(`You typed "${command}".`);
                return noop;
            });

            const response = Game.postPlayerCommand(
                new GameInstance(),
                "Hello, World!"
            );

            expect(response.instance).to.not.be.undefined;
            expect(response.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        id: 1,
                        data: 'You typed "Hello, World!".',
                        type: OutputLineType.NORMAL
                    }
                ]
            });
        });

        it("Requests do not modify previous instances", function() {
            onPlayerCommand(command => game => {
                if (!game.state.comms) {
                    game.state.comms = [command];
                } else {
                    game.state.comms = (<string[]>game.state.comms).concat(
                        command
                    );
                }
                return noop;
            });

            const r1 = Game.postPlayerCommand(new GameInstance(), "One");
            const r2 = Game.postPlayerCommand(r1.instance, "Two");
            const r3 = Game.postPlayerCommand(r2.instance, "Three");

            expect(r1.instance.state.comms).to.deep.equal(["One"]);
            expect(r2.instance.state.comms).to.deep.equal(["One", "Two"]);
            expect(r3.instance.state.comms).to.deep.equal([
                "One",
                "Two",
                "Three"
            ]);
        });

        it("Running the same request multiple times does not have any side effects", function() {
            onPlayerCommand(command => game => {
                if (!game.state.guy) {
                    game.state.guy = new Agent();
                }
                const guy = game.state.guy;
                guy[command] = true;

                game.output.write(`Set guy[${command}] to true.`);

                return noop;
            });

            const init = Game.postPlayerCommand(new GameInstance(), "init");

            let foo: GameResponse;
            for (let i = 0; i < 5; i++) {
                foo = Game.postPlayerCommand(init.instance, `foo${i}`);
            }

            expect(foo.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        id: 2,
                        data: "Set guy[foo4] to true.",
                        type: OutputLineType.NORMAL
                    }
                ]
            });
            expect(foo.instance.state.guy.init).to.be.true;
            expect(foo.instance.state.guy.foo3).to.be.undefined;
            expect(foo.instance.state.guy.foo4).to.be.true;
        });

        it("Invalid GameInstance isn't allowed", function() {
            onPlayerCommand(() => noop);

            const response = Game.postPlayerCommand(
                <GameInstance>(<any>"bork"),
                "bork"
            );

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Invalid GameInstance."
            );
            expect(response.instance).to.be.undefined;
        });

        it("Undefined command isn't allowed", function() {
            onPlayerCommand(() => noop);

            const response = Game.postPlayerCommand(
                new GameInstance(),
                undefined
            );

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Command must be defined."
            );
            expect(response.instance).to.be.undefined;
        });

        it("An error is thrown if the onPlayerCommand hook isn't set", function() {
            const response = Game.postPlayerCommand(new GameInstance(), "foo");

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: onPlayerCommand has not been implemented by the game developer."
            );
            expect(response.instance).to.be.undefined;
        });

        it("An error is thrown if the developer tries to throw an invalid error object", function() {
            onPlayerCommand(() => () => {
                throw 5;
            });

            const response = Game.postPlayerCommand(new GameInstance(), "foo");

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Invalid error object."
            );
            expect(response.instance).to.be.undefined;
        });

        it("A new RegalError is made if an error occurred during the game's runtime", function() {
            onPlayerCommand(() => () => {
                (<string[]>(<any>5)).push("blarp"); // yum
                return noop;
            });

            const response = Game.postPlayerCommand(new GameInstance(), "foo");

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: An error occurred while executing the request. Details: <TypeError: 5.push is not a function>"
            );
            expect(response.instance).to.be.undefined;
        });
    });
});
