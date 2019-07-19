import { expect } from "chai";
import "mocha";

import { on, noop, getUntrackedEventPK } from "../../src/events";
import { metadataWithOptions, getDemoMetadata, ePKs } from "../test-utils";
import { PropertyOperation, getGameInstancePK } from "../../src/agents";
import { RegalError } from "../../src/error";
import {
    Game,
    HookManager,
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "../../src/api";
import { buildGameInstance } from "../../src/state";

describe("API Hooks", function() {
    beforeEach(function() {
        Game.reset();
        Game.init(metadataWithOptions({ trackAgentChanges: true }));
    });

    it("playerCommandHook starts out undefined", function() {
        expect(HookManager.playerCommandHook).to.be.undefined;
    });

    it("startCommandHook starts out undefined", function() {
        expect(HookManager.startCommandHook).to.be.undefined;
    });

    it("beforeUndoCommandHook's default function just returns true", function() {
        expect(HookManager.beforeUndoCommandHook(buildGameInstance())).to.be
            .true;
    });

    describe("onPlayerCommand", function() {
        it("onPlayerCommand allows the developer to set how input is handled (using an EventFunction)", function() {
            onPlayerCommand(command => game => {
                game.state.input = command;
            });

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            expect(myGame.state.input).to.equal("Test Command");
        });

        it("Using onPlayerCommand with an EventFunction creates a TrackedEvent called INPUT", function() {
            onPlayerCommand(command => game => {
                game.state.input = command;
            });

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: getUntrackedEventPK().plus(1),
                    name: "INPUT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "input",
                            init: undefined,
                            final: "Test Command"
                        }
                    ]
                }
            ]);
        });

        it("onPlayerCommand allows the developer to set how input is handled (using a TrackedEvent)", function() {
            const setInput = (command: string) =>
                on("SET INPUT", game => {
                    game.state.input = command;
                });

            onPlayerCommand(setInput);

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            expect(myGame.state.input).to.equal("Test Command");
        });

        it("Using onPlayerCommand with a TrackedEvent 'X' creates a TrackedEvent called INPUT that causes X", function() {
            const setInput = (command: string) =>
                on("SET INPUT", game => {
                    game.state.input = command;
                });

            onPlayerCommand(setInput);

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            const [_epk0, epk1, epk2] = ePKs(2);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk2,
                    name: "SET INPUT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "input",
                            init: undefined,
                            final: "Test Command"
                        }
                    ],
                    causedBy: epk1
                },
                {
                    id: epk1,
                    name: "INPUT",
                    caused: [epk2]
                }
            ]);
        });

        it("onPlayerCommand allows the developer to set how input is handled (using an EventQueue)", function() {
            const setInput = (command: string) =>
                on("SET INPUT", game => {
                    game.state.input = command;
                });

            const doubleInput = on("DOUBLE INPUT", game => {
                game.state.input += ` ${game.state.input}`;
            });

            onPlayerCommand((cmd: string) => setInput(cmd).then(doubleInput));

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            expect(myGame.state.input).to.equal("Test Command Test Command");
        });

        it("Using onPlayerCommand with an EventQueue creates a TrackedEvent called INPUT that causes each event in the queue", function() {
            const setInput = (command: string) =>
                on("SET INPUT", game => {
                    game.state.input = command;
                });

            const doubleInput = on("DOUBLE INPUT", game => {
                game.state.input += ` ${game.state.input}`;
            });

            onPlayerCommand((cmd: string) => setInput(cmd).then(doubleInput));

            const myGame = buildGameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: 3,
                    name: "DOUBLE INPUT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.MODIFIED,
                            property: "input",
                            init: "Test Command",
                            final: "Test Command Test Command"
                        }
                    ],
                    causedBy: 1
                },
                {
                    id: 2,
                    name: "SET INPUT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "input",
                            init: undefined,
                            final: "Test Command"
                        }
                    ],
                    causedBy: 1
                },
                {
                    id: 1,
                    name: "INPUT",
                    caused: [2, 3]
                }
            ]);
        });

        it("onPlayerCommand cannot be called more than once", function() {
            onPlayerCommand(str => noop);
            expect(() => onPlayerCommand(str => noop)).to.throw(
                RegalError,
                "Cannot call onPlayerCommand more than once."
            );
        });

        it("onPlayerCommand's handler must be defined", function() {
            expect(() => onPlayerCommand(undefined)).to.throw(
                RegalError,
                "Handler must be defined."
            );
        });
    });

    describe("onStartCommand", function() {
        it("onStartCommand allows the developer to set how start is handled (using an EventFunction)", function() {
            onStartCommand(game => {
                game.state.init = true;
            });

            const myGame = buildGameInstance();
            HookManager.startCommandHook(myGame);

            expect(myGame.state.init).to.be.true;
        });

        it("using onStartCommand with an EventFunction creates a TrackedEvent called START", function() {
            onStartCommand(game => {
                game.state.init = true;
            });

            const myGame = buildGameInstance();
            HookManager.startCommandHook(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: getUntrackedEventPK().plus(1),
                    name: "START",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "init",
                            init: undefined,
                            final: true
                        }
                    ]
                }
            ]);
        });

        it("onStartCommand allows the developer to set how start is handled (using a TrackedEvent)", function() {
            const setInit = on("SET INIT", game => {
                game.state.init = true;
            });

            onStartCommand(setInit);

            const myGame = buildGameInstance();
            HookManager.startCommandHook(myGame);

            expect(myGame.state.init).to.be.true;
        });

        it("Using onStartCommand with a TrackedEvent 'X' creates a TrackedEvent called START that causes X", function() {
            const setInit = on("SET INIT", game => {
                game.state.init = true;
            });

            onStartCommand(setInit);

            const myGame = buildGameInstance();
            HookManager.startCommandHook(myGame);

            const [_epk0, epk1, epk2] = ePKs(2);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk2,
                    name: "SET INIT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "init",
                            init: undefined,
                            final: true
                        }
                    ],
                    causedBy: epk1
                },
                {
                    id: epk1,
                    name: "START",
                    caused: [epk2]
                }
            ]);
        });

        it("onStartCommand allows the developer to set how start is handled (using an EventQueue)", function() {
            const setFoo = (val: string) =>
                on("SET FOO", game => {
                    game.state.foo = val;
                });

            const setInit = on("SET INIT", game => {
                game.state.init = true;
                return setFoo("One");
            });

            const appendFoo = (val: string) =>
                on("APPEND FOO", game => {
                    game.state.foo += val;
                });

            onStartCommand(setInit.thenq(appendFoo("Two")));

            const myGame = buildGameInstance();
            HookManager.startCommandHook(myGame);

            expect(myGame.state.init).to.be.true;
            expect(myGame.state.foo).to.equal("OneTwo");
        });

        it("Using onStartCommand with an EventQueue creates a TrackedEvent called START that causes each event in the queue", function() {
            const setFoo = (val: string) =>
                on("SET FOO", game => {
                    game.state.foo = val;
                });

            const setInit = on("SET INIT", game => {
                game.state.init = true;
                return setFoo("One");
            });

            const appendFoo = (val: string) =>
                on("APPEND FOO", game => {
                    game.state.foo += val;
                });

            onStartCommand(setInit.thenq(appendFoo("Two")));

            const myGame = buildGameInstance();
            const [_epk0, epk1, epk2, epk3, epk4] = ePKs(4);
            HookManager.startCommandHook(myGame);

            expect(myGame.events.history).to.deep.equal([
                {
                    id: epk3,
                    name: "APPEND FOO",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.MODIFIED,
                            property: "foo",
                            init: "One",
                            final: "OneTwo"
                        }
                    ],
                    causedBy: epk1
                },
                {
                    id: epk4,
                    name: "SET FOO",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "foo",
                            init: undefined,
                            final: "One"
                        }
                    ],
                    causedBy: epk2
                },
                {
                    id: epk2,
                    name: "SET INIT",
                    changes: [
                        {
                            agentId: getGameInstancePK(),
                            op: PropertyOperation.ADDED,
                            property: "init",
                            init: undefined,
                            final: true
                        }
                    ],
                    causedBy: epk1,
                    caused: [epk4]
                },
                {
                    id: epk1,
                    name: "START",
                    caused: [epk2, epk3]
                }
            ]);
        });

        it("onStartCommand cannot be called more than once", function() {
            onStartCommand(noop);
            expect(() => onStartCommand(noop)).to.throw(
                RegalError,
                "Cannot call onStartCommand more than once."
            );
        });

        it("onStartCommand's handler must be defined", function() {
            expect(() => onStartCommand(undefined)).to.throw(
                RegalError,
                "Handler must be defined."
            );
        });
    });

    describe("onBeforeUndoCommand", function() {
        it("onBeforeUndoCommand allows the developer to set if undo is allowed for a given GameInstance", function() {
            onBeforeUndoCommand(
                game => game.state.foo !== undefined && game.state.foo > 10
            );

            const setFoo = (val: number) =>
                on("SET FOO", game => {
                    game.state.foo = val;
                });

            const myGame = buildGameInstance();

            expect(HookManager.beforeUndoCommandHook(myGame)).to.be.false;

            setFoo(15)(myGame);
            expect(HookManager.beforeUndoCommandHook(myGame)).to.be.true;

            setFoo(-3)(myGame);
            expect(HookManager.beforeUndoCommandHook(myGame)).to.be.false;
        });

        it("onBeforeUndoCommand cannot be called more than once", function() {
            onBeforeUndoCommand(game => game.state.foo);
            expect(() => onBeforeUndoCommand(game => game.state.bar)).to.throw(
                RegalError,
                "Cannot call onBeforeUndoCommand more than once."
            );
        });

        it("onBeforeUndoCommand's handler must be defined", function() {
            expect(() => onBeforeUndoCommand(undefined)).to.throw(
                RegalError,
                "Handler must be defined."
            );
        });
    });
});
