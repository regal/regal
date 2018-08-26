import { expect } from 'chai';
import 'mocha';

import { HookManager, onPlayerCommand, onStartCommand, onBeforeUndoCommand } from '../src/api-hooks';
import GameInstance from '../src/game-instance';
import { noop, on } from '../src/event';
import { log } from '../src/utils';
import { PropertyOperation } from '../src/agent';
import { RegalError } from '../src/error';

describe("API Hooks", function() {

    beforeEach(function() {
        HookManager.resetHooks();
    });

    it("playerCommandHook starts out undefined", function() {
        expect(HookManager.playerCommandHook).to.be.undefined;
    });

    it("startCommandHook starts out undefined", function() {
        expect(HookManager.startCommandHook).to.be.undefined;
    });

    it("beforeUndoCommandHook's default function just returns true", function() {
        expect(HookManager.beforeUndoCommandHook(new GameInstance())).to.be.true;
    });

    describe("onPlayerCommand", function() {

        it("onPlayerCommand allows the developer to set how input is handled (using an EventFunction)", function() {
            onPlayerCommand(command => game => {
                game.state.input = command;
                return noop;
            });
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.state.input).to.equal("Test Command");
        });
    
        it("Using onPlayerCommand with an EventFunction creates a TrackedEvent called INPUT", function() {
            onPlayerCommand(command => game => {
                game.state.input = command;
                return noop;
            });
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 1,
                    name: "INPUT",
                    changes: [{
                        agentId: 0,
                        op: PropertyOperation.ADDED,
                        property: "input",
                        init: undefined,
                        final: "Test Command"
                    }]
                }
            ]);
        });
    
        it("onPlayerCommand allows the developer to set how input is handled (using a TrackedEvent)", function() {
            const setInput = (command: string) => 
                on("SET INPUT", game => {
                    game.state.input = command;
                    return noop;
                });
    
            onPlayerCommand(setInput);
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.state.input).to.equal("Test Command");
        });
    
        it("Using onPlayerCommand with a TrackedEvent 'X' creates a TrackedEvent called INPUT that causes X.", function() {
            const setInput = (command: string) => 
                on("SET INPUT", game => {
                    game.state.input = command;
                    return noop;
                });
    
            onPlayerCommand(setInput);
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 2,
                    name: "SET INPUT",
                    changes: [{
                        agentId: 0,
                        op: PropertyOperation.ADDED,
                        property: "input",
                        init: undefined,
                        final: "Test Command"
                    }],
                    causedBy: 1
                },
                {
                    id: 1,
                    name: "INPUT",
                    caused: [ 2 ]
                }
            ]);
        });

        it("onPlayerCommand allows the developer to set how input is handled (using an EventQueue)", function() {
            const setInput = (command: string) => 
                on("SET INPUT", game => {
                    game.state.input = command;
                    return noop;
                });

            const doubleInput = on("DOUBLE INPUT", game => {
                game.state.input += ` ${game.state.input}`;
                return noop;
            })
    
            onPlayerCommand((cmd: string) => setInput(cmd).then(doubleInput));
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.state.input).to.equal("Test Command Test Command");
        });

        it("Using onPlayerCommand with an EventQueue creates a TrackedEvent called INPUT that causes each event in the queue", function() {
            const setInput = (command: string) => 
                on("SET INPUT", game => {
                    game.state.input = command;
                    return noop;
                });

            const doubleInput = on("DOUBLE INPUT", game => {
                game.state.input += ` ${game.state.input}`;
                return noop;
            })
    
            onPlayerCommand((cmd: string) => setInput(cmd).then(doubleInput));
    
            const myGame = new GameInstance();
            HookManager.playerCommandHook("Test Command")(myGame);
    
            expect(myGame.events.history).to.deep.equal([
                {
                    id: 3,
                    name: "DOUBLE INPUT",
                    changes: [{
                        agentId: 0,
                        op: PropertyOperation.MODIFIED,
                        property: "input",
                        init: "Test Command",
                        final: "Test Command Test Command"
                    }],
                    causedBy: 1
                },
                {
                    id: 2,
                    name: "SET INPUT",
                    changes: [{
                        agentId: 0,
                        op: PropertyOperation.ADDED,
                        property: "input",
                        init: undefined,
                        final: "Test Command"
                    }],
                    causedBy: 1
                },
                {
                    id: 1,
                    name: "INPUT",
                    caused: [ 2, 3 ]
                }
            ]);
        });

        it("onPlayerCommand cannot be called more than once", function() {
            onPlayerCommand(str => noop);
            expect(() => onPlayerCommand(str => noop)).to.throw(RegalError, "Cannot call onPlayerCommand more than once.");
        });

        it("onPlayerCommand's handler must be defined", function() {
            expect(() => onPlayerCommand(undefined)).to.throw(RegalError, "Handler must be defined.");
        });
    });
});