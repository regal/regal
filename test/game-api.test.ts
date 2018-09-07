import { expect } from "chai";
import "mocha";

import { Game, GameResponse, resetGame } from "../src/game-api";
import { onPlayerCommand, onStartCommand } from "../src/api-hooks";
import { noop } from "../src/events";
import GameInstance from "../src/game-instance";
import { OutputLineType } from "../src/output";
import { log } from "./utils";
import { Agent } from "../src/agents";
import { DEFAULT_GAME_OPTIONS, OPTION_KEYS, GameOptions } from "../src/config";

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

    describe("Game.postStartCommand", function() {
        it("Sending a good request sends the correct output", function() {
            onStartCommand(game => {
                game.output.write("Hello, world!");
                return noop;
            });

            const response = Game.postStartCommand();

            expect(response.instance).to.not.be.undefined;
            expect(response.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        id: 1,
                        data: "Hello, world!",
                        type: OutputLineType.NORMAL
                    }
                ]
            });
        });

        it("An error is thrown if the onStartCommand hook isn't set", function() {
            const response = Game.postStartCommand();

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: onStartCommand has not been implemented by the game developer."
            );
            expect(response.instance).to.be.undefined;
        });

        it("An error is thrown if the developer tries to throw an invalid error object", function() {
            onStartCommand(() => {
                throw 5;
            });

            const response = Game.postStartCommand();

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Invalid error object."
            );
            expect(response.instance).to.be.undefined;
        });

        it("A new RegalError is made if an error occurred during the game's runtime", function() {
            onStartCommand(() => {
                (<string[]>(<any>"lars")).push("blarp");
                return noop;
            });

            const response = Game.postStartCommand();

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                'RegalError: An error occurred while executing the request. Details: <TypeError: "lars".push is not a function>'
            );
            expect(response.instance).to.be.undefined;
        });

        it("Sending a no-arg start request uses the default option values", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand();
            const options = response.instance.options;

            expect(options.overrides).to.deep.equal({});
            OPTION_KEYS.forEach(key =>
                expect(options[key]).to.equal(DEFAULT_GAME_OPTIONS[key])
            );
        });

        it("Sending an empty start request uses the default option values", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand({});
            const options = response.instance.options;

            expect(options.overrides).to.deep.equal({});
            OPTION_KEYS.forEach(key =>
                expect(options[key]).to.equal(DEFAULT_GAME_OPTIONS[key])
            );
        });

        it("Sending a start request with options overrides the defaults", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand({
                debug: true
            });
            const options = response.instance.options;

            expect(options.overrides).to.deep.equal({
                debug: true
            });
            expect(options.debug).to.be.true;
            expect(options.forbidChanges).to.equal(
                DEFAULT_GAME_OPTIONS.forbidChanges
            );
            expect(options.showMinor).to.equal(DEFAULT_GAME_OPTIONS.showMinor);
        });

        it("Sending a start request with invalid options throws an error (option does not exist)", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand(<any>{ foo: 3 });

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Invalid option name <foo>."
            );
            expect(response.instance).to.be.undefined;
        });

        it("Sending a start request with invalid options throws an error (option has the wrong type)", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand(<any>{ debug: 3 });

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: The option <debug> is of type <number>, must be of type <boolean>."
            );
            expect(response.instance).to.be.undefined;
        });

        it("Sending a start request with invalid options throws an error (option has the wrong type)", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand(<any>{ debug: [] });

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: The option <debug> is of type <object>, must be of type <boolean>."
            );
            expect(response.instance).to.be.undefined;
        });

        describe("Option validation checks", function() {
            it("GameOptions.debug VALID", function() {
                onStartCommand(game => noop);

                const response = Game.postStartCommand({
                    debug: true
                });
                const options = response.instance.options;

                expect(response.output.wasSuccessful).to.be.true;
                expect(options.overrides).to.deep.equal({
                    debug: true
                });
                expect(options.debug).to.be.true;
            });

            it("GameOptions.debug INVALID", function() {
                onStartCommand(game => noop);

                const response = Game.postStartCommand(<any>{ foo: 3 });

                expect(response.output.wasSuccessful).to.be.false;
                expect(response.output.error.message).to.equal(
                    "RegalError: Invalid option name <foo>."
                );
                expect(response.instance).to.be.undefined;
            });

            it("GameOptions.forbidChanges VALID", function() {
                onStartCommand(game => noop);

                const response1 = Game.postStartCommand({
                    forbidChanges: true
                });
                const options1 = response1.instance.options;

                expect(response1.output.wasSuccessful).to.be.true;
                expect(options1.overrides).to.deep.equal({
                    forbidChanges: true
                });
                expect(options1.forbidChanges).to.be.true;

                const response2 = Game.postStartCommand({
                    forbidChanges: []
                });
                const options2 = response2.instance.options;

                expect(response2.output.wasSuccessful).to.be.true;
                expect(options2.overrides).to.deep.equal({
                    forbidChanges: []
                });
                expect(options2.forbidChanges).to.deep.equal([]);

                const response3 = Game.postStartCommand({
                    forbidChanges: ["debug", "forbidChanges"]
                });
                const options3 = response3.instance.options;

                expect(response3.output.wasSuccessful).to.be.true;
                expect(options3.overrides).to.deep.equal({
                    forbidChanges: ["debug", "forbidChanges"]
                });
                expect(options3.forbidChanges).to.deep.equal([
                    "debug",
                    "forbidChanges"
                ]);
            });

            it("GameOptions.forbidChanges INVALID", function() {
                onStartCommand(game => noop);

                const response1 = Game.postStartCommand(<any>{
                    forbidChanges: 5
                });

                expect(response1.output.wasSuccessful).to.be.false;
                expect(response1.output.error.message).to.equal(
                    "RegalError: The option <forbidChanges> is of type <number>, must be of type <boolean> or <string[]>."
                );
                expect(response1.instance).to.be.undefined;

                const response2 = Game.postStartCommand({
                    forbidChanges: ["blark"]
                });

                expect(response2.output.wasSuccessful).to.be.false;
                expect(response2.output.error.message).to.equal(
                    "RegalError: The option <blark> does not exist."
                );
                expect(response2.instance).to.be.undefined;
            });
        });
    });
});
