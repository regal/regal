import { expect } from "chai";
import "mocha";

import { Game, GameResponse } from "../../src/game-api";
import {
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "../../src/api-hooks";
import { noop } from "../../src/events";
import GameInstance from "../../src/game-instance";
import { OutputLineType, GameOutput, InstanceOutput } from "../../src/output";
import { log, getDemoMetadata, metadataWithOptions } from "../test-utils";
import { Agent } from "../../src/agents";
import {
    DEFAULT_GAME_OPTIONS,
    OPTION_KEYS,
    MetadataManager
} from "../../src/config";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Game API", function() {
    beforeEach(function() {
        Game.reset();
        MetadataManager.setMetadata(getDemoMetadata());
        Game.init();
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
                    game.state.comms = game.state.comms.concat(command);
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

        it("The GameInstance is scrubbed before a new player command is applied", function() {
            const printDummyNames = (dums: Dummy[], output: InstanceOutput) => {
                output.write(`Dummies: ${dums.map(d => d.name).join(", ")}.`);
            };
            onStartCommand(game => {
                game.state.arr = [new Dummy("D1", 10), new Dummy("D2", 15)];
                printDummyNames(game.state.arr as Dummy[], game.output);
                return noop;
            });

            onPlayerCommand(() => game => {
                const arr = game.state.arr as Dummy[];
                arr.pop();
                printDummyNames(arr, game.output);
                return noop;
            });

            const r1 = Game.postStartCommand();

            expect(
                r1.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);

            expect(r1.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        data: "Dummies: D1, D2.",
                        id: 1,
                        type: OutputLineType.NORMAL
                    }
                ]
            });

            const r2 = Game.postPlayerCommand(r1.instance, "");

            expect(
                r1.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);

            expect(r2.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        data: "Dummies: D1.",
                        id: 2,
                        type: OutputLineType.NORMAL
                    }
                ]
            });

            const r3 = Game.postPlayerCommand(r2.instance, "");

            expect(
                r2.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r3.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2]);

            expect(r3.output).to.deep.equal({
                wasSuccessful: true,
                log: [
                    {
                        data: "Dummies: .",
                        id: 3,
                        type: OutputLineType.NORMAL
                    }
                ]
            });

            const r4 = Game.postPlayerCommand(r3.instance, "");

            expect(
                r3.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2]);
            expect(
                r4.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1]);
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
            expect(options.allowOverrides).to.equal(
                DEFAULT_GAME_OPTIONS.allowOverrides
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
    });

    describe("Game.postOptionCommand", function() {
        it("Overriding an allowed option when nothing has yet been overridden", function() {
            const myGame = new GameInstance();

            expect(myGame.options.debug).to.be.false;

            const response = Game.postOptionCommand(myGame, { debug: true });

            expect(response.output.wasSuccessful).to.be.true;
            expect(response.instance.options.debug).to.be.true;
            expect(response.instance.options.overrides).to.deep.equal({
                debug: true
            });
        });

        it("Overriding options multiple times", function() {
            let response = Game.postOptionCommand(new GameInstance(), {
                debug: true,
                showMinor: false
            });

            response = Game.postOptionCommand(response.instance, {
                debug: false
            });

            expect(response.output.wasSuccessful).to.be.true;
            expect(response.instance.options.debug).to.be.false;
            expect(response.instance.options.showMinor).to.be.false;
            expect(response.instance.options.overrides).to.deep.equal({
                debug: false,
                showMinor: false
            });
        });

        it("Trying to override a forbidden option", function() {
            MetadataManager.setMetadata(
                metadataWithOptions({ allowOverrides: false })
            );

            const response = Game.postOptionCommand(new GameInstance(), {
                debug: true
            });

            expect(response.instance).to.be.undefined;
            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: No option overrides are allowed."
            );
        });
    });

    describe("Game.postUndoCommand", function() {
        it("Undo a simple operation", function() {
            onStartCommand(game => {
                game.state.foo = true;
                game.state.dummy = new Dummy("Lars", 10);
                return noop;
            });

            onPlayerCommand(command => game => {
                game.state.foo = false;
                game.state.dummy.name = command;
                return noop;
            });

            const initResponse = Game.postPlayerCommand(
                Game.postStartCommand().instance,
                "Jimbo"
            );

            expect(initResponse.instance.state.foo).to.be.false;
            expect(initResponse.instance.state.dummy.name).to.equal("Jimbo");

            const undoResponse = Game.postUndoCommand(initResponse.instance);

            expect(undoResponse.output.wasSuccessful).to.be.true;
            expect(undoResponse.instance.state.foo).to.be.true;
            expect(undoResponse.instance.state.dummy.name).to.equal("Lars");
        });

        it("When the player uses onBeforeUndoCommand to block the undo, an error is thrown", function() {
            onStartCommand(game => {
                game.state.foo = false;
                return noop;
            });
            onBeforeUndoCommand(game => game.state.foo);

            const undoResponse = Game.postUndoCommand(
                Game.postStartCommand().instance
            );

            expect(undoResponse.output.wasSuccessful).to.be.false;
            expect(undoResponse.output.error.message).to.equal(
                "RegalError: Undo is not allowed here."
            );
            expect(undoResponse.instance).to.be.undefined;
        });

        it("Undoing operations on agent arrays", function() {
            onStartCommand(game => {
                game.state.arr = [new Dummy("D1", 10), new Dummy("D2", 15)];
                return noop;
            });

            onPlayerCommand(() => game => {
                const arr = game.state.arr as Dummy[];
                arr.pop();
                return noop;
            });

            const r1 = Game.postStartCommand();

            expect(
                r1.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r1.instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(2);
            expect(r1.instance.state.arr[1].name).to.equal("D2");

            const r2 = Game.postPlayerCommand(r1.instance, "");

            expect(
                r1.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2.instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(1);
            expect(r1.instance.state.arr[0].name).to.equal("D1");

            const r3 = Game.postUndoCommand(r2.instance);

            expect(
                r3.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r3.instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(2);
            expect(r1.instance.state.arr[1].name).to.equal("D2");

            const r4 = Game.postPlayerCommand(r3.instance, "");

            expect(
                r4.instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r4.instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(1);
            expect(r1.instance.state.arr[0].name).to.equal("D1");
        });

        it("Undo an undo", function() {
            onStartCommand(game => {
                game.state.str = "";
                return noop;
            });

            onPlayerCommand(cmd => game => {
                game.state.str += cmd;
                return noop;
            });

            const r1 = Game.postStartCommand();
            expect(r1.instance.state.str).to.equal("");

            const r2 = Game.postPlayerCommand(r1.instance, "foo");
            expect(r2.instance.state.str).to.equal("foo");

            const r3 = Game.postPlayerCommand(r2.instance, "bar");
            expect(r3.instance.state.str).to.equal("foobar");

            const r4 = Game.postUndoCommand(r3.instance);
            expect(r4.instance.state.str).to.equal("foo");

            const r5 = Game.postUndoCommand(r4.instance);
            expect(r5.instance.state.str).to.equal("foobar");

            const r6 = Game.postUndoCommand(r5.instance);
            expect(r6.instance.state.str).to.equal("foo");
        });

        it("Undoing an undo with agent references", function() {
            onStartCommand(game => {
                game.state.parent = new Dummy("D1", 10);
                game.state.parent.child = new Dummy("D2", 15);
                return noop;
            });

            onPlayerCommand(() => game => {
                delete game.state.parent;
                return noop;
            });

            const r1 = Game.postStartCommand();
            expect(r1.instance.state.parent.child).to.deep.equal({
                id: 2,
                name: "D2",
                health: 15
            });

            const r2 = Game.postPlayerCommand(r1.instance, "");
            expect(r2.instance.state.parent).to.be.undefined;

            const r3 = Game.postUndoCommand(r2.instance);
            expect(r3.instance.state.parent.child).to.deep.equal({
                id: 2,
                name: "D2",
                health: 15
            });

            const r4 = Game.postPlayerCommand(r3.instance, "");
            expect(r4.instance.state.parent).to.be.undefined;
        });
    });

    describe("Game.getMetadataCommand", function() {
        it("Get metadata after it's been set", function() {
            const response = Game.getMetadataCommand();

            expect(response.instance).to.be.undefined;
            expect(response.output.wasSuccessful).to.be.true;
            expect(response.output.metadata).to.deep.equal(getDemoMetadata());
        });

        it("Catch the error if metadata has not been set", function() {
            MetadataManager.reset();
            const response = Game.getMetadataCommand();

            expect(response.instance).to.be.undefined;
            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.metadata).to.be.undefined;
            expect(response.output.error.message).to.equal(
                "RegalError: Metadata is not defined. Did you remember to load the config?"
            );
        });
    });
});
