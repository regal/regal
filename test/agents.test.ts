import { expect } from "chai";
import "mocha";

import GameInstance from "../src/game-instance";
import { RegalError } from "../src/error";
import {
    Agent,
    StaticAgentRegistry,
    AgentRecord,
    AgentReference,
    PropertyOperation
} from "../src/agents";
import { log, getDemoMetadata } from "./test-utils";
import { on, noop, EventRecord } from "../src/events";
import { MetadataManager } from "../src/config";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Agents", function() {
    before(function() {
        MetadataManager.forceConfig(getDemoMetadata());
    });

    after(function() {
        MetadataManager.reset();
    });

    beforeEach(function() {
        StaticAgentRegistry.resetRegistry();
    });

    describe("Agent Behavior", function() {
        it("Registering an agent adds its properties to the instance", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).register(myGame);

            expect(myGame.agents.hasOwnProperty(1)).to.be.true;
            expect(myGame.agents.hasAgentProperty(1, "name")).to.be.true;
            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("D1");
            expect(myGame.agents.hasAgentProperty(1, "health")).to.be.true;
            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(10);
        });

        it("It's possible to register an agent with a custom ID", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).register(myGame, 15);

            expect(dummy.id).to.equal(15);
        });

        it("If setting a custom ID, it must be positive", function() {
            expect(() =>
                new Dummy("D1", 10).register(new GameInstance(), -10)
            ).to.throw(RegalError, "newId must be positive.");
        });

        it("If setting a custom ID, it cannot already be assigned to a registered agent", function() {
            const myGame = new GameInstance();
            const d1 = new Dummy("D1", 10).register(myGame);

            expect(() => new Dummy("D2", 12).register(myGame, 1)).to.throw(
                RegalError,
                "An agent with ID <1> has already been registered with the instance."
            );
        });

        it("Registering an agent takes the next available agent ID", function() {
            const myGame = new GameInstance();
            const d1 = new Dummy("D1", 10).register(myGame);
            const d2 = new Dummy("D2", 12).register(myGame);
            const d3 = new Dummy("D3", 0).register(myGame);

            expect(d1.id).to.equal(1);
            expect(d2.id).to.equal(2);
            expect(d3.id).to.equal(3);
        });

        it("Registering an agent takes the next available agent ID (custom IDs)", function() {
            const myGame = new GameInstance();
            const d1 = new Dummy("D1", 10).register(myGame, 2);
            const d2 = new Dummy("D2", 12).register(myGame);
            const d3 = new Dummy("D3", 0).register(myGame);

            expect(d1.id).to.equal(2);
            expect(d2.id).to.equal(1);
            expect(d3.id).to.equal(3);
        });

        it("An unregistered agent's ID is undefined", function() {
            expect(new Dummy("D1", 10).id).to.be.undefined;
        });

        it("An agent's ID can be set exactly once", function() {
            const dummy = new Dummy("D1", 10);
            dummy.id = 5;

            expect(dummy.id).to.equal(5);
            expect(() => (dummy.id = 10)).to.throw(
                RegalError,
                "Cannot change an agent's ID once it has been set."
            );
        });

        it("The GameInstance must be defined to register the agent.", function() {
            expect(() => new Dummy("D1", 10).register(undefined)).to.throw(
                RegalError,
                "The GameInstance must be defined to register the agent."
            );
        });

        it("Cannot register an agent more than once.", function() {
            const game = new GameInstance();

            expect(() =>
                new Dummy("D1", 10).register(game).register(game)
            ).to.throw(RegalError, "Cannot register an agent more than once.");
        });

        it("Error check for InstanceAgents#getAgentProperty for an unused ID", function() {
            expect(() =>
                new GameInstance().agents.getAgentProperty(1, "foo")
            ).to.throw(
                RegalError,
                "No agent with ID <1> exists in the instance or the static registry."
            );
        });

        it("Error check for InstanceAgents#setAgentProperty for an unused ID", function() {
            expect(() =>
                new GameInstance().agents.setAgentProperty(
                    1,
                    "foo",
                    "bar",
                    EventRecord.default
                )
            ).to.throw(
                RegalError,
                "No agent with ID <1> exists in the instance or the static registry."
            );
        });

        it("Error check for InstanceAgents#hasAgentProperty for an unused ID", function() {
            expect(() =>
                new GameInstance().agents.hasAgentProperty(1, "foo")
            ).to.throw(
                RegalError,
                "No agent with ID <1> exists in the instance or the static registry."
            );
        });

        it("Error check for InstanceAgents#deleteAgentProperty for an unused ID", function() {
            expect(() =>
                new GameInstance().agents.deleteAgentProperty(
                    1,
                    "foo",
                    EventRecord.default
                )
            ).to.throw(
                RegalError,
                "No agent with ID <1> exists in the instance or the static registry."
            );
        });

        it("Registering an agent registers its property agents as well", function() {
            const game = new GameInstance();
            let dummy = new Dummy("D1", 10);
            const childDummy = new Dummy("D2", 15);
            dummy["child"] = childDummy;

            dummy = dummy.register(game);

            expect(dummy.isRegistered).to.be.true;
            expect(childDummy.isRegistered).to.be.true;
        });

        it("Adding an agent as a property to a registered agent registers it", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            const childDummy = new Dummy("D2", 15);

            expect(dummy.isRegistered).to.be.true;
            expect(childDummy.isRegistered).to.be.false;

            dummy["child"] = childDummy;

            expect(dummy.isRegistered).to.be.true;
            expect(childDummy.isRegistered).to.be.true;
        });

        it("Agent properties are replaced by AgentReferences", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            const childDummy = new Dummy("D2", 15);
            dummy["child"] = childDummy;

            expect(game.agents[1].child[0].final).to.deep.equal(
                new AgentReference(2)
            );
        });

        it("AgentReferences are invisible", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            const childDummy = new Dummy("D2", 15);
            dummy["child"] = childDummy;

            expect(dummy["child"].name).to.equal("D2");
            expect(dummy["child"].health).to.equal(15);
        });

        it("Properties can be set across AgentReferences", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            const childDummy = new Dummy("D2", 15);
            dummy["child"] = childDummy;

            dummy["child"].name = "Paul Blart";

            expect(dummy["child"].name).to.equal("Paul Blart");
            expect(dummy["child"].health).to.equal(15);
        });

        it("When a property is set across an AgentReference, the new property is accessible from the original agent definition", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            const childDummy = new Dummy("D2", 15);
            dummy["child"] = childDummy;

            dummy["child"].name = "Paul Blart";

            expect(childDummy.name).to.equal("Paul Blart");
        });

        it("Trying to retrive an undefined property of a registered agent returns undefined", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            expect(dummy["foo"]).to.be.undefined;
        });

        it("A non-registered agent's `has` method works properly", function() {
            const dummy = new Dummy("D1", 10);

            expect("name" in dummy).to.be.true;
            expect("foo" in dummy).to.be.false;
        });

        it("Registered agents' properties may be deleted", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).register(myGame);

            expect(dummy.name).to.equal("D1");
            expect("name" in dummy).to.be.true;

            delete dummy.name;

            expect(dummy.name).to.be.undefined;
            expect("name" in dummy).to.be.false;
        });

        it("Unregistered agents' properties may be deleted", function() {
            const dummy = new Dummy("D1", 10);

            expect(dummy.name).to.equal("D1");
            expect("name" in dummy).to.be.true;

            delete dummy.name;

            expect(dummy.name).to.be.undefined;
            expect("name" in dummy).to.be.false;
        });
    });

    describe("Static Agents", function() {
        it("The static agent registry has no agents to begin with", function() {
            expect(StaticAgentRegistry.agentCount).to.equal(0);
        });

        it("Defining a static agent lets it retain its original properties", function() {
            const dummy = new Dummy("D1", 10).static();

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
        });

        it("Defining a static agent assigns it an ID in the order it was made static", function() {
            const dummy1 = new Dummy("D1", 10).static();
            let dummy3 = new Dummy("D3", 109);
            const dummy2 = new Dummy("D2", -2).static();
            dummy3 = dummy3.static();

            expect(dummy1.id).to.equal(1);
            expect(dummy2.id).to.equal(2);
            expect(dummy3.id).to.equal(3);
        });

        it("The isStatic property of static agents is appropriately assigned", function() {
            const dummy = new Dummy("D1", 10);

            expect(dummy.isStatic).to.be.false;

            dummy.static();

            expect(dummy.isStatic).to.be.true;
        });

        it("Declaring an agent static adds it to the registry", function() {
            const dummy = new Dummy("D1", 10).static();

            expect(StaticAgentRegistry.agentCount).to.equal(1);

            expect(StaticAgentRegistry.hasAgent(dummy.id)).to.be.true;
            expect(StaticAgentRegistry.hasAgentProperty(dummy.id, "name")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(1, "health")).to.be
                .true;

            expect(StaticAgentRegistry.getAgentProperty(1, "name")).to.equal(
                "D1"
            );
            expect(
                StaticAgentRegistry.getAgentProperty(dummy.id, "health")
            ).to.equal(10);
        });

        it("The static agent registry doesn't have any false positives", function() {
            const dummy = new Dummy("D1", 10).static();

            expect(StaticAgentRegistry.hasAgent(0)).to.be.false;
            expect(StaticAgentRegistry.hasAgent(2)).to.be.false;
            expect(StaticAgentRegistry.hasAgentProperty(dummy.id, "non")).to.be
                .false;
            expect(StaticAgentRegistry.hasAgentProperty(2, "name")).to.be.false;
        });

        it("Cannot declare an agent static multiple times", function() {
            const dummy = new Dummy("D1", 10).static();

            expect(() => dummy.static()).to.throw(
                RegalError,
                "Cannot create more than one static version of an agent."
            );
        });

        it("Cannot create a static version of a registered agent.", function() {
            const dummy = new Dummy("D1", 10).register(new GameInstance());

            expect(() => dummy.static()).to.throw(
                RegalError,
                "Cannot create a static version of a registered agent."
            );
        });

        it("Error check for StaticAgentRegistry#getAgentProperty", function() {
            expect(() =>
                StaticAgentRegistry.getAgentProperty(100, "foo")
            ).to.throw(
                RegalError,
                "No static agent with ID <100> exists in the registry."
            );
        });

        it("Registering a static agent does not modify the game instance", function() {
            const dummy = new Dummy("D1", 10).static();
            const game = new GameInstance();

            dummy.register(game);
            expect(game).to.deep.equal(new GameInstance());
        });

        it("A static agent's #has method includes user-defined agent properties", function() {
            const dummy = new Dummy("D1", 10).static();
            expect("name" in dummy).to.be.true;
        });

        it("Modifying a registered static agent adds the property to the instance state", function() {
            const dummy = new Dummy("D1", 10).static();
            const myGame = new GameInstance();

            on("MODIFY", game => {
                const myDummy = dummy.register(game);
                myDummy.health += 15;
                myDummy.name = "Jeff";
                myDummy["newProp"] = "newValue";

                return noop;
            })(myGame);

            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(25);
            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Jeff");
            expect(myGame.agents.getAgentProperty(1, "newProp")).to.equal(
                "newValue"
            );
        });

        it("Modifying a registered static agent does not modify the one in the registry", function() {
            const dummy = new Dummy("D1", 10).static();
            const myGame = new GameInstance();

            on("MODIFY", game => {
                const myDummy = dummy.register(game);
                myDummy.health += 15;
                myDummy.name = "Jeff";
                myDummy["newProp"] = "newValue";

                return noop;
            })(myGame);

            expect(StaticAgentRegistry.getAgentProperty(1, "health")).to.equal(
                10
            );
            expect(StaticAgentRegistry.getAgentProperty(1, "name")).to.equal(
                "D1"
            );
            expect(StaticAgentRegistry.getAgentProperty(1, "newProp")).to.be
                .undefined;
        });

        it("After static agents are created, registering a nonstatic agent will get the next available ID", function() {
            const staticDummy = new Dummy("D1", 10).static();
            const game = new GameInstance();
            const nonstaticDummy = new Dummy("D2", -21).register(game);

            expect(nonstaticDummy.id).to.equal(2);
        });

        it("If setting a custom ID, it cannot already be assigned to a static agent", function() {
            const myGame = new GameInstance();
            const d1 = new Dummy("D1", 10).static().register(myGame);

            expect(() => new Dummy("D2", 12).register(myGame, 1)).to.throw(
                RegalError,
                "A static agent already has the ID <1>."
            );
        });

        it("A static agent's properties can be deleted", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).static().register(myGame);

            expect(dummy.name).to.equal("D1");
            expect("name" in dummy).to.be.true;

            delete dummy.name;

            expect(dummy.name).to.be.undefined;
            expect("name" in dummy).to.be.false;
        });

        it("InstanceAgents#deleteAgentProperty will return false if one tries to delete a static agent property that doesn't exist", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).static().register(myGame);

            expect(
                myGame.agents.deleteAgentProperty(1, "foo", EventRecord.default)
            ).to.be.false;
        });
    });

    describe("Instance State", function() {
        it("The instance state is automatically registered", function() {
            expect(new GameInstance().state.isRegistered).to.be.true;
        });

        it("The instance state has a reserved ID of zero", function() {
            expect(new GameInstance().state.id).to.equal(0);
        });

        it("Properties can be added and read from the instance state", function() {
            const game = new GameInstance();
            game.state.foo = "bar";

            expect(game.state.foo).to.equal("bar");
        });

        it("Adding an agent to the state implicitly registers it", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10);

            game.state.dum = dummy;

            expect(game.state.dum.isRegistered).to.be.true;
            expect(game.state.dum.id).to.equal(1);
            expect(game.state.dum.name).to.equal("D1");
            expect(game.state.dum.health).to.equal(10);
        });

        it("Adding a registered agent to the state uses its existing ID as a reference", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game, 100);

            game.state.dum = dummy;

            expect(game.state.dum.isRegistered).to.be.true;
            expect(game.state.dum.id).to.equal(100);
            expect(game.state.dum.name).to.equal("D1");
            expect(game.state.dum.health).to.equal(10);
        });
    });

    describe("Agent Records", function() {
        it("getProperty on a nonexistent property returns undefined", function() {
            expect(new AgentRecord().getProperty("foo")).to.be.undefined;
        });

        it("Registering an agent adds all of its properties to a new record", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            expect(game.agents[1]).to.deep.equal({
                _id: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.ADDED,
                        init: undefined,
                        final: 1
                    }
                ],

                game: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.ADDED,
                        init: undefined,
                        final: game
                    }
                ],

                name: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.ADDED,
                        init: undefined,
                        final: "D1"
                    }
                ],

                health: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.ADDED,
                        init: undefined,
                        final: 10
                    }
                ]
            });
        });

        it("Modifying a registered agent's property adds a record", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            dummy.name = "Jimmy";

            expect(game.agents[1].name).to.deep.equal([
                {
                    eventId: 0,
                    eventName: "DEFAULT",
                    op: PropertyOperation.MODIFIED,
                    init: "D1",
                    final: "Jimmy"
                },
                {
                    eventId: 0,
                    eventName: "DEFAULT",
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });

        it("Modifying a static agent's property adds only that change to the record", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).static().register(game);

            dummy.name = "Jimmy";
            dummy["foo"] = "bar";

            expect(game.agents[1]).to.deep.equal({
                name: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.MODIFIED,
                        init: "D1",
                        final: "Jimmy"
                    }
                ],
                foo: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.ADDED,
                        init: undefined,
                        final: "bar"
                    }
                ]
            });
        });

        it("Deleting a registered agent's property adds a record", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            delete dummy.name;

            expect(game.agents[1].name).to.deep.equal([
                {
                    eventId: 0,
                    eventName: "DEFAULT",
                    op: PropertyOperation.DELETED,
                    init: "D1",
                    final: undefined
                },
                {
                    eventId: 0,
                    eventName: "DEFAULT",
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });

        it("Deleting a static agent's property adds only that change to the record", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).static().register(game);

            delete dummy.name;

            expect(game.agents[1]).to.deep.equal({
                name: [
                    {
                        eventId: 0,
                        eventName: "DEFAULT",
                        op: PropertyOperation.DELETED,
                        init: "D1",
                        final: undefined
                    }
                ]
            });
        });

        it("If you try and delete a nonexistent property of a registered agent, nothing will happen", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).register(game);

            delete dummy["foo"];

            expect(game.agents[1].foo).to.be.undefined;
        });

        it("If you try and delete a nonexistent property of a registered static agent, nothing will happen", function() {
            const game = new GameInstance();
            const dummy = new Dummy("D1", 10).static().register(game);

            delete dummy["foo"];

            expect(game.agents[1]).to.be.undefined;
        });

        it("AgentRecord#deleteProperty will return false if one tries to delete a agent property that doesn't exist", function() {
            const myGame = new GameInstance();
            const dummy = new Dummy("D1", 10).register(myGame);

            expect(
                myGame.agents[1].deleteProperty(EventRecord.default, 1, "foo")
            ).to.be.false;
        });
    });

    describe("Cycling InstanceAgents", function() {
        it("InstanceAgents.cycle creates all new Agents that have only the last values of each of the original agents' properties", function() {
            const myGame = new GameInstance();

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                    return noop;
                });
            })(myGame);

            // Verify initial condition
            expect(myGame.agents).to.deep.equal({
                game: myGame,
                0: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 0,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: myGame,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    dummy: [
                        {
                            eventId: 1,
                            eventName: "INIT",
                            init: undefined,
                            final: {
                                refId: 1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: 2,
                            eventName: "MOD",
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                },
                1: {
                    _id: [
                        {
                            eventId: 1,
                            eventName: "INIT",
                            init: undefined,
                            final: 1,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 1,
                            eventName: "INIT",
                            init: undefined,
                            final: myGame,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    name: [
                        {
                            eventId: 2,
                            eventName: "MOD",
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
                        },
                        {
                            eventId: 1,
                            eventName: "INIT",
                            init: undefined,
                            final: "D1",
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: 1,
                            eventName: "INIT",
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }
            });

            const game2 = new GameInstance();
            game2.agents = myGame.agents.cycle(game2);

            // Verify proper cycle
            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 0,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    dummy: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: {
                                refId: 1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                },
                1: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 1,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    name: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: "Jimmy",
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }
            });
        });

        it("InstanceAgents.cycle copies only the properties of static agents that are different than their initial values", function() {
            const myGame = new GameInstance();
            const staticDummy = new Dummy("D1", 10).static();

            on("INIT", game => {
                game.state.dummy = staticDummy;

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                    return noop;
                });
            })(myGame);

            const game2 = new GameInstance();
            game2.agents = myGame.agents.cycle(game2);

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 0,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    dummy: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: {
                                refId: 1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                },
                1: {
                    name: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
                        }
                    ]
                }
            });
        });

        it("InstanceAgents.cycle does not copy the properties of non-static agents that were most recently deleted", function() {
            const myGame = new GameInstance();

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    delete game.state.dummy.name;
                    delete game.state.foo;
                    return noop;
                });
            })(myGame);

            const game2 = new GameInstance();
            game2.agents = myGame.agents.cycle(game2);

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 0,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    dummy: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: {
                                refId: 1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ]
                },
                1: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 1,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }
            });
        });

        it("InstanceAgents.cycle DOES copy the properties of STATIC agents that were most recently deleted", function() {
            const myGame = new GameInstance();
            const staticDummy = new Dummy("D1", 10).static();

            on("INIT", game => {
                game.state.dummy = staticDummy;

                return on("MOD", game => {
                    delete game.state.dummy.name;
                    return noop;
                });
            })(myGame);

            const game2 = new GameInstance();
            game2.agents = myGame.agents.cycle(game2);

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    _id: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: 0,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    game: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: game2,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    dummy: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: undefined,
                            final: {
                                refId: 1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ]
                },
                1: {
                    name: [
                        {
                            eventId: 0,
                            eventName: "DEFAULT",
                            init: "D1",
                            final: undefined,
                            op: PropertyOperation.DELETED
                        }
                    ]
                }
            });
        });
    });
});
