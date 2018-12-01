import { expect } from "chai";
import "mocha";

import {
    Game,
    GameResponse,
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand,
    HookManager
} from "../../src/api";
import { noop, on } from "../../src/events";
import { OutputLineType, InstanceOutput } from "../../src/output";
import {
    log,
    getDemoMetadata,
    metadataWithOptions,
    metadataWithVersion,
    Dummy
} from "../test-utils";
import { Agent, StaticAgentRegistry } from "../../src/agents";
import {
    DEFAULT_GAME_OPTIONS,
    OPTION_KEYS,
    InstanceOptionsInternal,
    MetadataManager
} from "../../src/config";
import {
    buildGameInstance,
    GameInstance,
    GameInstanceInternal,
    ContextManager
} from "../../src/state";
import { SEED_LENGTH } from "../../src/random";
import { RegalError } from "../../src/error";

const keysBesidesSeed = OPTION_KEYS.filter(key => key !== "seed");
const NO_INIT_MSG =
    "RegalError: Game has not been initalized. Did you remember to call Game.init?";

describe("Game API", function() {
    beforeEach(function() {
        Game.reset();
        Game.init(getDemoMetadata());
    });

    describe("Initialization", function() {
        it("Game.isInitialized defaults to false", function() {
            Game.reset();
            expect(Game.isInitialized).to.be.false;
        });

        it("Game.init sets Game.isInitialized to true", function() {
            expect(Game.isInitialized).to.be.true;
        });

        it("Calling Game.init multiple times throws an error", function() {
            expect(() => Game.init(getDemoMetadata())).to.throw(
                RegalError,
                "Game has already been initialized."
            );
        });

        it("Game.init sets the game's metadata", function() {
            expect(MetadataManager.getMetadata()).to.deep.equal(
                metadataWithVersion(getDemoMetadata())
            );
        });

        it("Game.init sets context to non-static", function() {
            expect(ContextManager.isContextStatic()).to.be.false;
        });
    });

    it("Game.reset properly resets the static classes", function() {
        Game.reset();

        expect(Game.isInitialized).to.be.false;
        expect(ContextManager.isContextStatic()).to.be.true;

        expect(HookManager.playerCommandHook).to.be.undefined;
        expect(HookManager.startCommandHook).to.be.undefined;
        expect(HookManager.beforeUndoCommandHook(undefined)).to.be.true; // Always return true

        expect(StaticAgentRegistry.getNextAvailableId()).to.equal(1);
        expect(() => MetadataManager.getMetadata()).to.throw(
            RegalError,
            "Metadata is not defined. Did you remember to load the config?"
        );
    });

    describe("Game.postPlayerCommand", function() {
        it("Sending a good request sends the correct output", function() {
            onPlayerCommand(command => game => {
                game.output.write(`You typed "${command}".`);
            });

            const response = Game.postPlayerCommand(
                buildGameInstance(),
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
            });

            const r1 = Game.postPlayerCommand(buildGameInstance(), "One");
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
            });

            const init = Game.postPlayerCommand(buildGameInstance(), "init");

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
                buildGameInstance(),
                undefined
            );

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Command must be defined."
            );
            expect(response.instance).to.be.undefined;
        });

        it("An error is thrown if the onPlayerCommand hook isn't set", function() {
            const response = Game.postPlayerCommand(buildGameInstance(), "foo");

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

            const response = Game.postPlayerCommand(buildGameInstance(), "foo");

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: Invalid error object."
            );
            expect(response.instance).to.be.undefined;
        });

        it("A new RegalError is made if an error occurred during the game's runtime", function() {
            onPlayerCommand(() => () => {
                (<string[]>(<any>5)).push("blarp"); // yum
            });

            const response = Game.postPlayerCommand(buildGameInstance(), "foo");

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

            interface S {
                arr: Dummy[];
            }

            onStartCommand(
                on<S>("INIT", game => {
                    game.state.arr = [new Dummy("D1", 10), new Dummy("D2", 15)];
                    printDummyNames(game.state.arr, game.output);
                })
            );

            onPlayerCommand(() =>
                on<S>("COMMAND", game => {
                    game.state.arr.pop();
                    printDummyNames(game.state.arr, game.output);
                })
            );

            const r1 = Game.postStartCommand();
            const r1_instance = r1.instance as GameInstanceInternal;

            expect(
                r1_instance.agents.agentManagers().map(am => am.id)
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
            const r2_instance = r2.instance as GameInstanceInternal;

            expect(
                r1_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2_instance.agents.agentManagers().map(am => am.id)
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
            const r3_instance = r3.instance as GameInstanceInternal;

            expect(
                r2_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r3_instance.agents.agentManagers().map(am => am.id)
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
            const r4_instance = r4.instance as GameInstanceInternal;

            expect(
                r3_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2]);
            expect(
                r4_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1]);
        });

        it("Calling before initialization throws an error", function() {
            const i = buildGameInstance();
            Game.reset();

            const response = Game.postPlayerCommand(i, "foo");

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(NO_INIT_MSG);
            expect(response.instance).to.be.undefined;
        });
    });

    describe("Game.postStartCommand", function() {
        it("Sending a good request sends the correct output", function() {
            onStartCommand(game => {
                game.output.write("Hello, world!");
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
            const options = response.instance
                .options as InstanceOptionsInternal;

            expect(options.overrides).to.deep.equal({});
            keysBesidesSeed.forEach(key =>
                expect(options[key]).to.equal(DEFAULT_GAME_OPTIONS[key])
            );

            expect(options.seed.length).to.equal(SEED_LENGTH);
        });

        it("Sending an empty start request uses the default option values", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand({});
            const options = response.instance
                .options as InstanceOptionsInternal;

            expect(options.overrides).to.deep.equal({});
            keysBesidesSeed.forEach(key =>
                expect(options[key]).to.equal(DEFAULT_GAME_OPTIONS[key])
            );

            expect(options.seed.length).to.equal(SEED_LENGTH);
        });

        it("Sending a start request with options overrides the defaults", function() {
            onStartCommand(game => noop);

            const response = Game.postStartCommand({
                debug: true
            });
            const options = response.instance
                .options as InstanceOptionsInternal;

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

        it("Calling before initialization throws an error", function() {
            Game.reset();

            const response = Game.postStartCommand();

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(NO_INIT_MSG);
            expect(response.instance).to.be.undefined;
        });
    });

    describe("Game.postOptionCommand", function() {
        it("Overriding an allowed option when nothing has yet been overridden", function() {
            const myGame = buildGameInstance();

            expect(myGame.options.debug).to.be.false;

            const response = Game.postOptionCommand(myGame, { debug: true });

            expect(response.output.wasSuccessful).to.be.true;
            expect(response.instance.options.debug).to.be.true;
            expect(
                (response.instance.options as InstanceOptionsInternal).overrides
            ).to.deep.equal({
                debug: true
            });
        });

        it("Overriding options multiple times", function() {
            let response = Game.postOptionCommand(buildGameInstance(), {
                debug: true,
                showMinor: false
            });

            response = Game.postOptionCommand(response.instance, {
                debug: false
            });

            expect(response.output.wasSuccessful).to.be.true;
            expect(response.instance.options.debug).to.be.false;
            expect(response.instance.options.showMinor).to.be.false;
            expect(
                (response.instance.options as InstanceOptionsInternal).overrides
            ).to.deep.equal({
                debug: false,
                showMinor: false
            });
        });

        it("Trying to override a forbidden option", function() {
            Game.reset();
            Game.init(metadataWithOptions({ allowOverrides: false }));

            const response = Game.postOptionCommand(buildGameInstance(), {
                debug: true
            });

            expect(response.instance).to.be.undefined;
            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(
                "RegalError: No option overrides are allowed."
            );
        });

        it("Calling before initialization throws an error", function() {
            const i = buildGameInstance();
            Game.reset();

            const response = Game.postOptionCommand(i, { debug: false });

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(NO_INIT_MSG);
            expect(response.instance).to.be.undefined;
        });
    });

    describe("Game.postUndoCommand", function() {
        it("Undo a simple operation", function() {
            onStartCommand(game => {
                game.state.foo = true;
                game.state.dummy = new Dummy("Lars", 10);
            });

            onPlayerCommand(command => game => {
                game.state.foo = false;
                game.state.dummy.name = command;
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
            });

            onPlayerCommand(() => game => {
                const arr = game.state.arr as Dummy[];
                arr.pop();
            });

            const r1 = Game.postStartCommand();
            const r1_instance = r1.instance as GameInstanceInternal;

            expect(
                r1_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r1_instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(2);
            expect(r1.instance.state.arr[1].name).to.equal("D2");

            const r2 = Game.postPlayerCommand(r1.instance, "");
            const r2_instance = r2.instance as GameInstanceInternal;

            expect(
                r1_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r2_instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(1);
            expect(r1.instance.state.arr[0].name).to.equal("D1");

            const r3 = Game.postUndoCommand(r2.instance);
            const r3_instance = r3.instance as GameInstanceInternal;

            expect(
                r3_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r3_instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(2);
            expect(r1_instance.state.arr[1].name).to.equal("D2");

            const r4 = Game.postPlayerCommand(r3.instance, "");
            const r4_instance = r4.instance as GameInstanceInternal;

            expect(
                r4_instance.agents.agentManagers().map(am => am.id)
            ).to.deep.equal([0, 1, 2, 3]);
            expect(
                r4_instance.agents.getAgentProperty(0, "arr").length
            ).to.equal(1);
            expect(r1.instance.state.arr[0].name).to.equal("D1");
        });

        it("Undo an undo", function() {
            onStartCommand(game => {
                game.state.str = "";
            });

            onPlayerCommand(cmd => game => {
                game.state.str += cmd;
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
            });

            onPlayerCommand(() => game => {
                delete game.state.parent;
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

        it("Calling before initialization throws an error", function() {
            const i = buildGameInstance();
            Game.reset();

            const response = Game.postUndoCommand(i);

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(NO_INIT_MSG);
            expect(response.instance).to.be.undefined;
        });

        it("Undoing an event with use of random", function() {
            Game.reset();
            Game.init(metadataWithOptions({ seed: "lars" }));

            onStartCommand(game => {
                game.state.randos = [];
            });

            onPlayerCommand(() => game => {
                game.state.randos.push(game.random.string(5, "abcedef"));
            });

            let response = Game.postStartCommand();
            response = Game.postPlayerCommand(response.instance, "");
            response = Game.postPlayerCommand(response.instance, "");

            // Precondition: the given seed should generate these random strings
            expect(response.instance.state.randos).to.deep.equal([
                "edede",
                "dfaff"
            ]);

            // Undoing the last command should remove the second string
            response = Game.postUndoCommand(response.instance);
            expect(response.instance.state.randos).to.deep.equal(["edede"]);

            // Reposting the same command should generate the same string again
            response = Game.postPlayerCommand(response.instance, "");
            expect(response.instance.state.randos).to.deep.equal([
                "edede",
                "dfaff"
            ]);
        });
    });

    describe("Game.getMetadataCommand", function() {
        it("Get metadata after it's been set", function() {
            const response = Game.getMetadataCommand();

            expect(response.instance).to.be.undefined;
            expect(response.output.wasSuccessful).to.be.true;
            expect(response.output.metadata).to.deep.equal(
                metadataWithVersion(getDemoMetadata())
            );
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

        it("Calling before initialization throws an error", function() {
            Game.reset();

            const response = Game.getMetadataCommand();

            expect(response.output.wasSuccessful).to.be.false;
            expect(response.output.error.message).to.equal(NO_INIT_MSG);
            expect(response.instance).to.be.undefined;
        });
    });
});
