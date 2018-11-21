import { expect } from "chai";
import "mocha";

import { RegalError } from "../../src/error";
import {
    OPTION_KEYS,
    DEFAULT_GAME_OPTIONS,
    MetadataManager,
    ensureOverridesAllowed
} from "../../src/config";
import { OutputLineType } from "../../src/output";
import { getDemoMetadata, metadataWithOptions, log } from "../test-utils";
import { on } from "../../src/events";
import { Agent, PropertyOperation } from "../../src/agents";
import { Game, onStartCommand, onPlayerCommand } from "../../src/api";
import { buildGameInstance, GameInstanceInternal } from "../../src/state";
import { SEED_LENGTH, DEFAULT_SEED_CHARSET } from "../../src/random";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Config", function() {
    beforeEach(function() {
        Game.reset();
        MetadataManager.setMetadata(getDemoMetadata());
        Game.init();
    });

    describe("Game Options", function() {
        it("Test defaults", function() {
            const myGame = buildGameInstance();

            const keysBesidesSeed = OPTION_KEYS.filter(key => key !== "seed");

            keysBesidesSeed.forEach(key => {
                expect(myGame.options[key]).to.deep.equal(
                    DEFAULT_GAME_OPTIONS[key]
                );
            });

            expect(myGame.options.seed.length).to.equal(SEED_LENGTH);
        });

        describe("GameOption Validation", function() {
            // debug

            it("GameOptions.debug VALID", function() {
                const myGame = buildGameInstance({ debug: true });
                expect(myGame.options.overrides).to.deep.equal({
                    debug: true
                });
                expect(myGame.options.debug).to.be.true;
            });

            it("GameOptions.debug INVALID", function() {
                expect(() => buildGameInstance(<any>{ debug: 3 })).to.throw(
                    RegalError,
                    "RegalError: The option <debug> is of type <number>, must be of type <boolean>."
                );
            });

            // allowOverrides cannot be overridden, so the following tests require changing the metadata config

            it("GameOptions.allowOverrides VALID: boolean", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions({ allowOverrides: true })
                );

                const myGame = buildGameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.be.true;
            });

            it("GameOptions.allowOverrides VALID: empty array", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions({ allowOverrides: [] })
                );

                const myGame = buildGameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.deep.equal([]);
            });

            it("GameOptions.allowOverrides VALID: valid array", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions({
                        allowOverrides: ["debug", "showMinor"]
                    })
                );

                const myGame = buildGameInstance();
                expect(myGame.options.overrides).to.deep.equal({});
                expect(myGame.options.allowOverrides).to.deep.equal([
                    "debug",
                    "showMinor"
                ]);
            });

            it("GameOptions.allowOverrides INVALID: mistype", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions(<any>{ allowOverrides: 3 })
                );
                expect(() => buildGameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <allowOverrides> is of type <number>, must be of type <boolean> or <string[]>."
                );
            });

            it("GameOptions.allowOverrides INVALID: illegal array", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions({ allowOverrides: ["debug", "blark"] })
                );
                expect(() => buildGameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <blark> does not exist."
                );
            });

            it("GameOptions.allowOverrides INVALID: allowing allowOverrides", function() {
                MetadataManager.setMetadata(
                    metadataWithOptions({ allowOverrides: ["allowOverrides"] })
                );
                expect(() => buildGameInstance()).to.throw(
                    RegalError,
                    "RegalError: The option <allowOverrides> is not allowed to be overridden."
                );
            });

            // showMinor

            it("GameOptions.showMinor VALID", function() {
                const myGame = buildGameInstance({ showMinor: true });
                expect(myGame.options.overrides).to.deep.equal({
                    showMinor: true
                });
                expect(myGame.options.showMinor).to.be.true;
            });

            it("GameOptions.showMinor INVALID", function() {
                expect(() => buildGameInstance(<any>{ showMinor: 3 })).to.throw(
                    RegalError,
                    "RegalError: The option <showMinor> is of type <number>, must be of type <boolean>."
                );
            });

            // trackAgentChanges

            it("GameOptions.trackAgentChanges VALID", function() {
                const myGame = buildGameInstance({ trackAgentChanges: true });
                expect(myGame.options.overrides).to.deep.equal({
                    trackAgentChanges: true
                });
                expect(myGame.options.trackAgentChanges).to.be.true;
            });

            it("GameOptions.trackAgentChanges INVALID", function() {
                expect(() =>
                    buildGameInstance(<any>{ trackAgentChanges: "true" })
                ).to.throw(
                    RegalError,
                    "RegalError: The option <trackAgentChanges> is of type <string>, must be of type <boolean>."
                );
            });

            // seed

            it("GameOptions.seed VALID", function() {
                const seed = "goof123@~";
                const myGame = buildGameInstance({ seed });
                expect(myGame.options.overrides).to.deep.equal({
                    seed
                });
                expect(myGame.options.seed).to.equal(seed);
            });

            it("GameOptions.seed INVALID", function() {
                expect(() => buildGameInstance(<any>{ seed: 1234 })).to.throw(
                    RegalError,
                    "RegalError: The option <seed> is of type <number>, must be of type <string>."
                );
            });
        });

        describe("Option Behavior", function() {
            // debug

            it("DEBUG output is not printed when GameOptions.debug is set to false", function() {
                const myGame = buildGameInstance({ debug: false });
                myGame.output.writeDebug("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([]);
            });

            it("DEBUG output is printed when GameOptions.debug is set to true", function() {
                const myGame = buildGameInstance({ debug: true });
                myGame.output.writeDebug("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([
                    {
                        id: 1,
                        type: OutputLineType.DEBUG,
                        data: "Hello, world!"
                    }
                ]);
            });

            // showMinor

            it("MINOR output is not printed when GameOptions.showMinor is set to false", function() {
                const myGame = buildGameInstance({ showMinor: false });
                myGame.output.writeMinor("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([]);
            });

            it("MINOR output is printed when GameOptions.showMinor is set to true", function() {
                const myGame = buildGameInstance({ showMinor: true });
                myGame.output.writeMinor("Hello, world!");

                expect(myGame.output.lines).to.deep.equal([
                    {
                        id: 1,
                        type: OutputLineType.MINOR,
                        data: "Hello, world!"
                    }
                ]);
            });

            // trackAgentChanges

            function prepAgentTest() {
                const introduce = on("INTRODUCE", game => {
                    game.output.write(
                        `My name is ${game.state.currentDummy.name}. ${game
                            .state.dummyCount - 1} have come before me.`
                    );
                    game.state.currentDummy.health += 5;
                });

                const addDummy = (name: string) =>
                    on("ADD", game => {
                        const dummy = game.using(new Dummy(name, 10));
                        dummy.name += " the Great";

                        game.state.currentDummy = dummy;
                        game.state.dummyCount++;

                        return introduce;
                    });

                const init = on("INIT", game => {
                    game.state.dummyCount = 0;
                });

                onStartCommand(init);
                onPlayerCommand(addDummy);
            }

            it("Full agent property history is shown when GameOptions.trackAgentChanges is set to true", function() {
                prepAgentTest();

                let response = Game.postStartCommand({
                    trackAgentChanges: true
                });

                let responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 1,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 2,
                                eventName: "INIT",
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 2,
                        name: "INIT",
                        causedBy: 1,
                        changes: [
                            {
                                agentId: 0,
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "dummyCount"
                            }
                        ]
                    },
                    {
                        id: 1,
                        name: "START",
                        caused: [2]
                    }
                ]);

                response = Game.postPlayerCommand(response.instance, "Lars");
                responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 2,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: 1,
                                init: 0,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        currentDummy: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: { refId: 1 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "1": {
                        id: 1,
                        game: response.instance,
                        name: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: "Lars the Great",
                                init: "Lars",
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: "Lars",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: 5,
                                eventName: "INTRODUCE",
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: 10,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 5,
                        name: "INTRODUCE",
                        causedBy: 4,
                        output: [1],
                        changes: [
                            {
                                agentId: 1,
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED,
                                property: "health"
                            }
                        ]
                    },
                    {
                        id: 4,
                        name: "ADD",
                        causedBy: 3,
                        caused: [5],
                        changes: [
                            {
                                agentId: 1,
                                final: "Lars",
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "name"
                            },
                            {
                                agentId: 1,
                                final: 10,
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "health"
                            },
                            {
                                agentId: 1,
                                final: "Lars the Great",
                                init: "Lars",
                                op: PropertyOperation.MODIFIED,
                                property: "name"
                            },
                            {
                                agentId: 0,
                                final: { refId: 1 },
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "currentDummy"
                            },
                            {
                                agentId: 0,
                                final: 1,
                                init: 0,
                                op: PropertyOperation.MODIFIED,
                                property: "dummyCount"
                            }
                        ]
                    },
                    {
                        id: 3,
                        name: "INPUT",
                        caused: [4]
                    }
                ]);

                response = Game.postPlayerCommand(response.instance, "Jeffrey");
                responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 3,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: 2,
                                init: 1,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 1,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        currentDummy: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: { refId: 2 },
                                init: { refId: 1 },
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: { refId: 1 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "1": {
                        id: 1,
                        game: response.instance,
                        name: [
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: "Lars the Great",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 15,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "2": {
                        id: 2,
                        game: response.instance,
                        name: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: "Jeffrey the Great",
                                init: "Jeffrey",
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: "Jeffrey",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: 8,
                                eventName: "INTRODUCE",
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: 10,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 8,
                        name: "INTRODUCE",
                        causedBy: 7,
                        output: [2],
                        changes: [
                            {
                                agentId: 2,
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED,
                                property: "health"
                            }
                        ]
                    },
                    {
                        id: 7,
                        name: "ADD",
                        causedBy: 6,
                        caused: [8],
                        changes: [
                            {
                                agentId: 2,
                                final: "Jeffrey",
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "name"
                            },
                            {
                                agentId: 2,
                                final: 10,
                                init: undefined,
                                op: PropertyOperation.ADDED,
                                property: "health"
                            },
                            {
                                agentId: 2,
                                final: "Jeffrey the Great",
                                init: "Jeffrey",
                                op: PropertyOperation.MODIFIED,
                                property: "name"
                            },
                            {
                                agentId: 0,
                                final: { refId: 2 },
                                init: { refId: 1 },
                                op: PropertyOperation.MODIFIED,
                                property: "currentDummy"
                            },
                            {
                                agentId: 0,
                                final: 2,
                                init: 1,
                                op: PropertyOperation.MODIFIED,
                                property: "dummyCount"
                            }
                        ]
                    },
                    {
                        id: 6,
                        name: "INPUT",
                        caused: [7]
                    }
                ]);
            });

            it("Reduced agent property history is shown when GameOptions.trackAgentChanges is set to false", function() {
                prepAgentTest();

                let response = Game.postStartCommand({
                    trackAgentChanges: false
                });
                let responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 1,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 2,
                                eventName: "INIT",
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 2,
                        name: "INIT",
                        causedBy: 1
                    },
                    {
                        id: 1,
                        name: "START",
                        caused: [2]
                    }
                ]);

                response = Game.postPlayerCommand(response.instance, "Lars");
                responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 2,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: 1,
                                init: 0,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        currentDummy: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: { refId: 1 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "1": {
                        id: 1,
                        game: response.instance,
                        name: [
                            {
                                eventId: 4,
                                eventName: "ADD",
                                final: "Lars the Great",
                                init: "Lars",
                                op: PropertyOperation.MODIFIED
                            }
                        ],
                        health: [
                            {
                                eventId: 5,
                                eventName: "INTRODUCE",
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 5,
                        name: "INTRODUCE",
                        causedBy: 4,
                        output: [1]
                    },
                    {
                        id: 4,
                        name: "ADD",
                        causedBy: 3,
                        caused: [5]
                    },
                    {
                        id: 3,
                        name: "INPUT",
                        caused: [4]
                    }
                ]);

                response = Game.postPlayerCommand(response.instance, "Jeffrey");
                responseInstance = response.instance as GameInstanceInternal;

                expect(responseInstance.agents).to.deep.equal({
                    _nextId: 3,
                    game: response.instance,
                    "0": {
                        id: 0,
                        game: response.instance,
                        dummyCount: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: 2,
                                init: 1,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 1,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        currentDummy: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: { refId: 2 },
                                init: { refId: 1 },
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: { refId: 1 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "1": {
                        id: 1,
                        game: response.instance,
                        name: [
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: "Lars the Great",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: 0,
                                eventName: "DEFAULT",
                                final: 15,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    },
                    "2": {
                        id: 2,
                        game: response.instance,
                        name: [
                            {
                                eventId: 7,
                                eventName: "ADD",
                                final: "Jeffrey the Great",
                                init: "Jeffrey",
                                op: PropertyOperation.MODIFIED
                            }
                        ],
                        health: [
                            {
                                eventId: 8,
                                eventName: "INTRODUCE",
                                final: 15,
                                init: 10,
                                op: PropertyOperation.MODIFIED
                            }
                        ]
                    }
                });
                expect(responseInstance.events.history).to.deep.equal([
                    {
                        id: 8,
                        name: "INTRODUCE",
                        causedBy: 7,
                        output: [2]
                    },
                    {
                        id: 7,
                        name: "ADD",
                        causedBy: 6,
                        caused: [8]
                    },
                    {
                        id: 6,
                        name: "INPUT",
                        caused: [7]
                    }
                ]);
            });

            it("Throw an error if a property history is longer than two when trackAgentChanges is disabled", function() {
                const myGame = buildGameInstance({ trackAgentChanges: false });
                const d = myGame.using(new Dummy("D1", 10));

                on("FOO", game => {
                    d.name = "Jim";
                })(myGame);

                myGame.agents
                    .getAgentManager(1)
                    .getPropertyHistory("name")
                    .unshift({} as any);

                expect(() => (d.name = "Foo")).to.throw(
                    RegalError,
                    "Property history length cannot be greater than two when trackAgentChanges is disabled"
                );
            });

            // seed (randomness testing is in random.test.ts)

            it("If seed is not specified, it will default to a random string of given length", function() {
                const myGame = buildGameInstance();
                const seed = myGame.options.seed;

                expect(seed.length).to.equal(SEED_LENGTH);
                for (let i = 0; i < seed.length; i++) {
                    expect(DEFAULT_SEED_CHARSET.includes(seed[i])).to.be.true;
                }
                expect(myGame.random.seed).to.equal(seed);
            });

            it("If seed is specified, it will be the instance's seed", function() {
                const seed = "hello1234";
                const myGame = buildGameInstance({ seed });
                expect(myGame.options.seed).to.equal(seed);
                expect(myGame.random.seed).to.equal(seed);
            });
        });
    });

    describe("InstanceOptions", function() {
        it("The properties of InstanceOptions cannot be modified", function() {
            const myGame = buildGameInstance();
            expect(() => ((myGame.options as any).debug = true)).to.throw(
                RegalError,
                "Cannot modify the properties of InstanceOptions."
            );
        });

        it("The properties of InstanceOptions.overrides cannot be modified", function() {
            const myGame = buildGameInstance();
            expect(
                () => ((<any>myGame.options.overrides).debug = true)
            ).to.throw(
                RegalError,
                "Cannot modify the properties of the InstanceOption option overrides."
            );
        });

        it("ensureOverridesAllowed blocks overriding of the allowOverrides option", function() {
            expect(() =>
                ensureOverridesAllowed({ allowOverrides: true }, true)
            ).to.throw(
                RegalError,
                "The allowOverrides option can never be overridden."
            );
        });

        it("InstanceOptions cannot be created with forbidden options", function() {
            MetadataManager.setMetadata(
                metadataWithOptions({ allowOverrides: ["debug"] })
            );

            expect(() => buildGameInstance({ showMinor: false })).to.throw(
                RegalError,
                "The following option overrides are forbidden: <showMinor>."
            );
        });
    });

    describe("Metadata", function() {
        it("Throw error when no metadata has been set", function() {
            MetadataManager.reset();
            expect(() => MetadataManager.getMetadata()).to.throw(
                RegalError,
                "Metadata is not defined. Did you remember to load the config?"
            );
        });
    });
});
