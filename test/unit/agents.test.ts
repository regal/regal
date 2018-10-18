import { expect } from "chai";
import "mocha";

import { MetadataManager } from "../../src/config";
import { getDemoMetadata, log } from "../test-utils";
import { Game } from "../../src/game-api";
import {
    Agent,
    PropertyOperation,
    StaticAgentRegistry,
    buildRevertFunction
} from "../../src/agents";
import GameInstance from "../../src/game-instance";
import { RegalError } from "../../src/error";
import {
    DEFAULT_EVENT_ID,
    DEFAULT_EVENT_NAME
} from "../../src/events/event-record";
import { on, noop } from "../../src/events";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

class Parent extends Agent {
    constructor(public child: Dummy) {
        super();
    }
}

class Sibling extends Agent {
    constructor(public name: string, public sibling?: Sibling) {
        super();
    }
}

describe("Agents", function() {
    beforeEach(function() {
        Game.reset();
        MetadataManager.setMetadata(getDemoMetadata());
    });

    describe("Basic Usage", function() {
        it("Retrieve the initial properties of an active agent within a game cycle", function() {
            Game.init();

            const myGame = new GameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
        });

        it("Modify the properties of an active agent within a game cycle", function() {
            Game.init();

            const myGame = new GameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            dummy.health += 15;
            dummy["foo"] = "bar";

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(25);
            expect(dummy["foo"]).to.equal("bar");
        });

        it("Check the existence of an active agent's properties within a game cycle", function() {
            Game.init();

            const myGame = new GameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            delete dummy.health;

            expect("name" in dummy).to.be.true;
            expect("health" in dummy).to.be.false;
        });

        it("The properties of an inactive agent cannot be read during a game cycle", function() {
            Game.init();

            const _dummy = new Dummy("D1", 10);

            expect(() => _dummy.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be accessed within a game cycle."
            );
        });

        it("The properties of an inactive agent can only be set once during a game cycle", function() {
            Game.init();

            const _dummy = new Dummy("D1", 10);

            expect(() => (_dummy.health = 23)).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be set within a game cycle."
            );
        });

        it("The properties of an inactive agent cannot be deleted during a game cycle", function() {
            Game.init();

            const _dummy = new Dummy("D1", 10);

            expect(() => delete _dummy.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be deleted within a game cycle."
            );
        });

        it("Retrieve the initial properties of an active static agent within a game cycle", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();
            const dummy = myGame.using(DUMMY);

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
        });

        it("Modifying the initial properties of an active static agent within a game cycle does not change the original", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const game1 = new GameInstance();
            const dummy1 = game1.using(DUMMY);

            dummy1.health += 15;
            dummy1["foo"] = "bar";

            expect(dummy1.name).to.equal("D1");
            expect(dummy1.health).to.equal(25);
            expect("foo" in dummy1).to.be.true;
            expect(dummy1["foo"]).to.equal("bar");

            const game2 = new GameInstance();
            const dummy2 = game2.using(DUMMY);

            expect(dummy2.name).to.equal("D1");
            expect(dummy2.health).to.equal(10);
            expect("foo" in dummy2).to.be.false;
            expect(dummy2["foo"]).to.be.undefined;
        });

        it("Reading and writing the properties of a static agent outside the game cycle is allowed", function() {
            const DUMMY1 = new Dummy("D1", 10);
            const DUMMY2 = new Dummy("D2", DUMMY1.health);

            delete DUMMY1.name;
            DUMMY2.name += " Sr.";

            Game.init();

            const myGame = new GameInstance();
            const d1 = myGame.using(DUMMY1);
            const d2 = myGame.using(DUMMY2);

            expect("name" in d1).to.be.false;
            expect(d1.name).to.be.undefined;
            expect(d1.health).to.equal(10);

            expect("name" in d2).to.be.true;
            expect(d2.name).to.equal("D2 Sr.");
            expect(d2.health).to.equal(10);
        });

        it("Reading the properties of an inactive static agent inside the game cycle is not allowed", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            expect(() => DUMMY.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be accessed within a game cycle."
            );
        });

        it("Modifying the properties of an inactive static agent inside the game cycle is not allowed", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            expect(() => (DUMMY.health = 5)).to.throw(
                RegalError,
                "This static agent must be activated before it may be modified."
            );
        });
    });

    describe("Advanced Usage", function() {
        it("Active agents can have references to each other", function() {
            Game.init();

            const myGame = new GameInstance();
            const parent = myGame.using(new Parent(new Dummy("D1", 10)));

            expect(parent.child.name).to.equal("D1");
            expect(parent.child.health).to.equal(10);
        });

        it("Modifying properties through an active agent reference", function() {
            Game.init();

            const myGame = new GameInstance();
            const parent = myGame.using(new Parent(new Dummy("D1", 10)));

            parent.child.name += " Jr.";
            (parent.child as any).foo = "bar";
            delete parent.child.health;

            expect(parent.child.name).to.equal("D1 Jr.");
            expect((parent.child as any).foo).to.equal("bar");
            expect(parent.child.health).to.be.undefined;
            expect("health" in parent.child).to.be.false;
        });

        it("Active agents can have circular references to each other", function() {
            Game.init();

            const myGame = new GameInstance();
            const _sib1 = new Sibling("Billy");
            const _sib2 = new Sibling("Bob", _sib1);
            _sib1.sibling = _sib2;

            const sib1 = myGame.using(_sib1);
            const sib2 = myGame.using(_sib2);

            expect(sib1.name).to.equal("Billy");
            expect(sib2.name).to.equal("Bob");
            expect(sib1.sibling.name).to.equal("Bob");
            expect(sib2.sibling.name).to.equal("Billy");
        });

        it("Modifying active agent properties through circular references to each other", function() {
            Game.init();

            const myGame = new GameInstance();
            const _sib1 = new Sibling("Billy");
            const _sib2 = new Sibling("Bob", _sib1);
            _sib1.sibling = _sib2;

            const sib1 = myGame.using(_sib1);
            const sib2 = myGame.using(_sib2);

            sib1.sibling.name = "Bobbort";
            sib2.sibling.sibling.sibling = new Sibling("Lars");

            expect(sib1.name).to.equal("Billy");
            expect(sib2.name).to.equal("Bobbort");
            expect(sib1.sibling.name).to.equal("Bobbort");
            expect(sib2.sibling.name).to.equal("Lars");
        });

        it("Static agents can have references to each other", function() {
            const PARENT = new Parent(new Dummy("D1", 10));

            Game.init();

            const myGame = new GameInstance();
            const parent = myGame.using(PARENT);

            expect(parent.child.name).to.equal("D1");
            expect(parent.child.health).to.equal(10);
        });

        it("Modifying active static agents through references", function() {
            const PARENT = new Parent(new Dummy("D1", 10));

            Game.init();

            const myGame = new GameInstance();
            const parent = myGame.using(PARENT);

            parent.child.name += " III";
            (parent.child as any).foo = "bar";
            delete parent.child.health;

            expect(parent.child.name).to.equal("D1 III");
            expect((parent.child as any).foo).to.equal("bar");
            expect(parent.child.health).to.be.undefined;
            expect("health" in parent.child).to.be.false;
        });

        it("Static agents can have circular references to each other", function() {
            const SIB_1 = new Sibling("Billy");
            const SIB_2 = new Sibling("Bob", SIB_1);
            SIB_1.sibling = SIB_2;

            Game.init();

            const myGame = new GameInstance();

            const sib1 = myGame.using(SIB_1);
            const sib2 = myGame.using(SIB_2);

            expect(sib1.name).to.equal("Billy");
            expect(sib2.name).to.equal("Bob");
            expect(sib1.sibling.name).to.equal("Bob");
            expect(sib2.sibling.name).to.equal("Billy");
        });

        it("Activating only one agent in a circular static agent reference graph", function() {
            const SIB_1 = new Sibling("Billy");
            const SIB_2 = new Sibling("Bob", SIB_1);
            SIB_1.sibling = SIB_2;

            Game.init();

            const myGame = new GameInstance();

            const sib1 = myGame.using(SIB_1);

            expect(sib1.name).to.equal("Billy");
            expect(sib1.sibling.name).to.equal("Bob");
            expect(sib1.sibling.sibling.name).to.equal("Billy");
        });

        it("Modifying static agent properties through circular references", function() {
            const SIB_1 = new Sibling("Billy");
            const SIB_2 = new Sibling("Bob", SIB_1);
            SIB_1.sibling = SIB_2;

            Game.init();

            const myGame = new GameInstance();

            const sib1 = myGame.using(SIB_1);
            const sib2 = myGame.using(SIB_2);

            sib1.sibling.name = "Bobbort";
            sib2.sibling.sibling.sibling = new Sibling("Lars");

            expect(sib1.name).to.equal("Billy");
            expect(sib2.name).to.equal("Bobbort");
            expect(sib1.sibling.name).to.equal("Bobbort");
            expect(sib2.sibling.name).to.equal("Lars");
        });

        it("Assigning a static agent as a property as an inactive agent", function() {
            const CHILD = new Dummy("Bab", 1);

            Game.init();

            const myGame = new GameInstance();

            const parent = myGame.using(new Parent(CHILD));

            expect(parent.child.name).to.equal("Bab");
            expect(parent.child.health).to.equal(1);
        });

        it("Modifying a static agent that's a property of an active agent", function() {
            const CHILD = new Dummy("Bab", 1);

            Game.init();

            const myGame1 = new GameInstance();
            const parent1 = myGame1.using(new Parent(CHILD));

            const myGame2 = new GameInstance();
            const parent2 = myGame2.using(new Parent(CHILD));

            parent1.child.health += 15;
            parent2.child.name = "Jenkins";

            expect(parent1.child.name).to.equal("Bab");
            expect(parent1.child.health).to.equal(16);

            expect(parent2.child.name).to.equal("Jenkins");
            expect(parent2.child.health).to.equal(1);
        });

        it("Activating an agent multiple times returns a reference to the same agent", function() {
            Game.init();

            const myGame = new GameInstance();

            const dummy = myGame.using(new Dummy("D1", 10));
            dummy.name = "Lars";

            const dummyAlt = myGame.using(dummy);
            dummyAlt.health = 25;

            (dummy as any).foo = dummy.health;

            expect(dummy.name).to.equal("Lars");
            expect(dummy.health).to.equal(25);
            expect((dummy as any).foo).to.equal(25);

            expect(dummyAlt.name).to.equal("Lars");
            expect(dummyAlt.health).to.equal(25);
            expect((dummyAlt as any).foo).to.equal(25);
        });

        it("Activating a static agent multiple times returns a reference to the same agent", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            const dummy = myGame.using(DUMMY);
            dummy.name = "Lars";

            const dummyAlt = myGame.using(DUMMY);
            dummyAlt.health = 25;

            (dummy as any).foo = dummy.health;

            expect(dummy.name).to.equal("Lars");
            expect(dummy.health).to.equal(25);
            expect((dummy as any).foo).to.equal(25);

            expect(dummyAlt.name).to.equal("Lars");
            expect(dummyAlt.health).to.equal(25);
            expect((dummyAlt as any).foo).to.equal(25);
        });

        it("Activating multiple agents simulataneously using GameInstance.using's compound object argument", function() {
            Game.init();

            const myGame = new GameInstance();

            const { d1, d2 } = myGame.using({
                d1: new Dummy("D1", 15),
                d2: new Dummy("D2", 100)
            });

            expect(d1.name).to.equal("D1");
            expect(d1.health).to.equal(15);
            expect(d2.name).to.equal("D2");
            expect(d2.health).to.equal(100);
            expect(myGame.agents.agentManagers().length).to.equal(3);
        });

        it("Activating multiple static agents simulataneously", function() {
            const DUMMY = new Dummy("D1", 15);
            const PARENT = new Parent(DUMMY);

            Game.init();

            const myGame = new GameInstance();

            const { d, p } = myGame.using({ d: DUMMY, p: PARENT });
            p.child.health += 5;

            expect(d.name).to.equal("D1");
            expect(d.health).to.equal(20);
            expect(p.child.name).to.equal("D1");
            expect(p.child.health).to.equal(20);
            expect(myGame.agents.agentManagers().length).to.equal(2);
        });

        it("Activating multiple agents as a safety at the beginning of events", function() {
            const newChild = (_target: Parent) =>
                on("NEW CHILD", game => {
                    const { parent, child } = game.using({
                        parent: _target,
                        child: new Dummy("D1", 10)
                    });

                    parent.child = child;
                    game.state.parent = parent;

                    return noop;
                });

            const PARENT = new Parent(new Dummy("D0", 0));

            Game.init();

            // Using a static agent that hasn't been activated
            const myGame1 = new GameInstance();
            newChild(PARENT)(myGame1);

            expect(myGame1.state.parent.child.id).to.equal(3);
            expect(myGame1.state.parent.child.name).to.equal("D1");
            expect(myGame1.state.parent.child.health).to.equal(10);

            // Using a nonstatic agent that's been activated
            const myGame2 = new GameInstance();
            const myParent = myGame2.using(new Parent(new Dummy("D2", 2)));
            newChild(myParent)(myGame2);

            expect(myGame2.state.parent.child.id).to.equal(5);
            expect(myGame2.state.parent.child.name).to.equal("D1");
            expect(myGame2.state.parent.child.health).to.equal(10);

            // Using a nonstatic agent that hasn't been activated
            const myGame3 = new GameInstance();
            const myParent2 = new Parent(undefined);
            newChild(myParent2)(myGame3);

            expect(myGame3.state.parent.child.id).to.equal(4);
            expect(myGame3.state.parent.child.name).to.equal("D1");
            expect(myGame3.state.parent.child.health).to.equal(10);
        });

        describe("Agent Arrays", function() {
            it("Setting an active agent's property to be an empty array is functional", function() {
                Game.init();

                const myGame = new GameInstance();
                on("MOD", game => {
                    game.state.arr = [];
                    return noop;
                })(myGame);

                expect(myGame.state.arr).to.deep.equal([]);
            });

            it("Setting an active agent's property to be an empty array is tracked properly", function() {
                Game.init();

                const myGame = new GameInstance({ trackAgentChanges: true });
                on("MOD", game => {
                    game.state.arr = [];
                    return noop;
                })(myGame);

                expect(myGame.agents).to.deep.equal({
                    game: myGame,
                    0: {
                        id: 0,
                        game: myGame,
                        arr: [
                            {
                                eventId: 1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: []
                            }
                        ]
                    }
                });
                expect(myGame.events.history).to.deep.equal([
                    {
                        id: 1,
                        name: "MOD",
                        changes: [
                            {
                                agentId: 0,
                                property: "arr",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: []
                            }
                        ]
                    }
                ]);
            });

            // todo - remove
            it.skip("test", function() {
                const a = [1, 2, 3];
                const b = [4, 5, 6];

                const ap = new Proxy(a, {
                    set(
                        target: Array<Number>,
                        property: PropertyKey,
                        value: any
                    ): boolean {
                        log(target, "target");
                        log(property, "property");
                        log(value, "value");
                        return Reflect.set(target, property, value);
                    }
                });

                ap.fill(10);
                log(ap);
            });

            // todo - remove
            it.only("test", function() {
                Game.init();
                const myGame = new GameInstance({ trackAgentChanges: true });
                const a = myGame.using(new Agent());
                on("MOD", game => {
                    a["foo"] = [true];
                    a["foo"].push(false);
                    return noop;
                })(myGame);
                log(myGame);
            });
        });
    });

    describe("Agent Managers", function() {
        it("The AgentManager's id matches the agent's id", function() {
            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.id);

            expect(d.id).to.equal(dr.id);
        });

        it("The AgentManager's id matches the game instance", function() {
            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.game).to.equal(myGame);
        });

        it("AgentManager.hasPropertyRecord returns correct values", function() {
            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.id);

            delete d.health;

            expect(dr.hasPropertyRecord("name")).to.be.true;
            expect(dr.hasPropertyRecord("health")).to.be.true;
            expect(dr.hasPropertyRecord("foo")).to.be.false;
        });

        it("AgentManager.hasPropertyRecord returns false for properties only in the static agent", function() {
            const DUMMY = new Dummy("D1", 15);

            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(DUMMY);
            d.health += 15;

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.hasPropertyRecord("name")).to.be.false;
            expect(dr.hasPropertyRecord("health")).to.be.true;
        });

        it("AgentManager.getProperty returns the most recent property", function() {
            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            d.health += 15;

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.getProperty("name")).to.equal("D1");
            expect(dr.getProperty("health")).to.equal(30);
            expect(dr.getProperty("foo")).to.be.undefined;
        });

        it("AgentManager.getPropertyHistory returns the array of PropertyChanges", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.id);

            const addHealth = (dummy: Dummy) =>
                on("ADD HEALTH", game => {
                    dummy.health += 15;
                    return noop;
                });

            addHealth(d)(myGame);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);

            expect(dr.getPropertyHistory("health")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID + 1,
                    eventName: "ADD HEALTH",
                    op: PropertyOperation.MODIFIED,
                    init: 15,
                    final: 30
                },
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: 15
                }
            ]);
        });

        it("AgentManager.getPropertyHistory on a static agent returns only the PropertyChanges that differ from the original", function() {
            const DUMMY = new Dummy("D1", 15);
            (DUMMY as any).foo = "bar";

            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(DUMMY);

            delete (d as any).foo;

            const addHealth = (dummy: Dummy) =>
                on("ADD HEALTH", game => {
                    dummy.health += 15;
                    return noop;
                });

            addHealth(d)(myGame);

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([]);
            expect(dr.getPropertyHistory("health")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID + 1,
                    eventName: "ADD HEALTH",
                    op: PropertyOperation.MODIFIED,
                    init: 15,
                    final: 30
                }
            ]);
            expect(dr.getPropertyHistory("foo")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.DELETED,
                    init: "bar",
                    final: undefined
                }
            ]);
        });

        it("AgentManager.propertyWasDeleted returns true for real properties that were deleted", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(DUMMY);

            delete d.name;

            delete d.health;
            d.health = 15;

            (d as any).foo1 = "bar";

            (d as any).foo2 = "baz";
            delete (d as any).foo2;

            delete (d as any).foo3;

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.propertyWasDeleted("name")).to.be.true;
            expect(dr.propertyWasDeleted("health")).to.be.false;
            expect(dr.propertyWasDeleted("foo1")).to.be.false;
            expect(dr.propertyWasDeleted("foo2")).to.be.true;
            expect(dr.propertyWasDeleted("foo3")).to.be.false;
        });

        it("AgentManager does not add a record for setting a property to the same value", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            d.name = "D1";

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });

        it("AgentManager does not add a record for setting a property to its static value", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(DUMMY);

            d.name = "D1";

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([]);
        });

        it("AgentManager does not add a record for deleting a property multiple times", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            d.name = "D1";
            delete d.name;
            delete d.name;

            const dr = myGame.agents.getAgentManager(d.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.DELETED,
                    init: "D1",
                    final: undefined
                },
                {
                    eventId: DEFAULT_EVENT_ID,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });
    });

    describe("InstanceAgents", function() {
        it("InstanceAgents.recycle creates all new agents that have only the last values of each of the original agent' properties", function() {
            Game.init();

            const myGame = new GameInstance({ trackAgentChanges: true });

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
                    id: 0,
                    game: myGame,
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
                    id: 1,
                    game: myGame,
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

            const myGame2 = myGame.recycle();

            expect(myGame2.agents).to.deep.equal({
                game: myGame2,
                0: {
                    id: 0,
                    game: myGame2,
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
                    id: 1,
                    game: myGame2,
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

        it("InstanceAgents.recycle creates all new agents that have only the last values of each of the original agent' properties (without tracking agent properties)", function() {
            Game.init();

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
                    id: 0,
                    game: myGame,
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
                    id: 1,
                    game: myGame,
                    name: [
                        {
                            eventId: 2,
                            eventName: "MOD",
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
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

            const myGame2 = myGame.recycle();

            expect(myGame2.agents).to.deep.equal({
                game: myGame2,
                0: {
                    id: 0,
                    game: myGame2,
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
                    id: 1,
                    game: myGame2,
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

        it("InstanceAgents.recycle copies only the properties of static agents that are different than their initial values", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            on("INIT", game => {
                game.state.dummy = DUMMY;

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                    return noop;
                });
            })(myGame);

            const game2 = myGame.recycle();

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    id: 0,
                    game: game2,
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
                    id: 1,
                    game: game2,
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

        it("InstanceAgents.recycle does not copy the properties of non-static agents that were most recently deleted", function() {
            Game.init();

            const myGame = new GameInstance();

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    delete game.state.dummy.name;
                    delete game.state.foo;
                    return noop;
                });
            })(myGame);

            const game2 = myGame.recycle();

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    id: 0,
                    game: game2,
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
                    id: 1,
                    game: game2,
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

        it("InstanceAgents.recycle DOES copy the properties of STATIC agents that were most recently deleted", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            on("INIT", game => {
                game.state.dummy = DUMMY;

                return on("MOD", game => {
                    delete game.state.dummy.name;
                    return noop;
                });
            })(myGame);

            const game2 = myGame.recycle();

            expect(game2.agents).to.deep.equal({
                game: game2,
                0: {
                    id: 0,
                    game: game2,
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
                    id: 1,
                    game: game2,
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

        it("InstanceAgents.reserveNextId starts after the highest static agent and then counts up", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            expect(myGame.agents.reserveNewId()).to.equal(2);
            expect(myGame.agents.reserveNewId()).to.equal(3);
        });

        it("InstanceAgents.getAgentProperty gets the correct property from either the instance or static registry", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(DUMMY);
            d.health = 0;
            d.health += 5;
            (d as any).foo = true;

            expect(myGame.agents.getAgentProperty(d.id, "name")).to.equal("D1");
            expect(myGame.agents.getAgentProperty(d.id, "health")).to.equal(5);
            expect(myGame.agents.getAgentProperty(d.id, "foo")).to.be.true;
        });

        it("If the static agent hasn't been modified, InstanceAgents.getAgentProperty will call the static registry directly", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            const d = myGame.using(DUMMY);

            expect(myGame.agents.getAgentProperty(d.id, "name")).to.equal("D1");
            expect(myGame.agents.getAgentProperty(d.id, "bad")).to.be.undefined;
            expect(
                myGame.agents
                    .agentManagers()
                    .map(manager => manager.id)
                    .includes(d.id)
            ).to.be.false; // There isn't an agent manager for this agent
        });

        it("Error check for InstanceAgents.getAgentProperty with an invalid id", function() {
            Game.init();

            const myGame = new GameInstance();

            expect(() => myGame.agents.getAgentProperty(1, "foo")).to.throw(
                RegalError,
                "No agent with the id <1> exists."
            );
        });

        it("InstanceAgents.getAgentProperty returns undefined for an non-existent agent property", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            expect(myGame.agents.getAgentProperty(1, "foo")).to.be.undefined;
        });

        it("InstanceAgents.getAgentProperty returns an agent proxy when the value of the static agent's property is an agent", function() {
            const DUMMY = new Dummy("D1", 10);
            const PARENT = new Parent(DUMMY);

            Game.init();

            const myGame = new GameInstance();
            const p = myGame.using(PARENT);

            const child = myGame.agents.getAgentProperty(2, "child");
            expect(child).to.deep.equal({});
            expect(child.id).to.equal(DUMMY.id);
            expect(child.name).to.equal("D1");
        });

        it("InstanceAgents.setAgentProperty works properly", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            myGame.agents.setAgentProperty(d.id, "name", "Lars");

            expect(d.name).to.equal("Lars");
        });

        it("InstanceAgents.setAgentProperty implicitly activates an agent", function() {
            const SIB = new Sibling("Billy");

            Game.init();

            const myGame = new GameInstance();

            myGame.agents.setAgentProperty(
                1,
                "sibling",
                new Sibling("Bob", SIB)
            );

            expect(myGame.agents.agentManagers().length).to.equal(3); // State, SIB, SIB's sibling
            expect(myGame.using(SIB).sibling.name).to.equal("Bob");
            expect(new GameInstance().using(SIB).sibling).to.be.undefined;
        });

        it("Error check InstanceAgents.setAgentProperty with id", function() {
            Game.init();

            const myGame = new GameInstance();
            myGame.using(new Dummy("D1", 10));

            expect(() => myGame.agents.setAgentProperty(1, "id", 2)).to.throw(
                RegalError,
                "The agent's <id> property cannot be set."
            );
        });

        it("Error check InstanceAgents.setAgentProperty with game", function() {
            Game.init();

            const myGame = new GameInstance();
            myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.setAgentProperty(1, "game", new GameInstance())
            ).to.throw(
                RegalError,
                "The agent's <game> property cannot be set."
            );
        });

        it("Error check InstanceAgents.setAgentProperty with an invalid id", function() {
            Game.init();

            const myGame = new GameInstance();
            expect(() =>
                myGame.agents.setAgentProperty(1, "foo", true)
            ).to.throw("No agent with the id <1> exists.");
        });

        it("InstanceAgents.hasAgentProperty works properly with static agents", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            expect(myGame.agents.hasAgentProperty(DUMMY.id, "name")).to.be.true;
            expect(myGame.agents.hasAgentProperty(DUMMY.id, "health")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(DUMMY.id, "foo")).to.be.false;
        });

        it("InstanceAgents.hasAgentProperty works properly with static agents that have been modified in the cycle", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();

            myGame.using(DUMMY).health += 15;

            expect(myGame.agents.hasAgentProperty(DUMMY.id, "name")).to.be.true;
            expect(myGame.agents.hasAgentProperty(DUMMY.id, "health")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(DUMMY.id, "foo")).to.be.false;
        });

        it("InstanceAgents.hasAgentProperty works properly with nonstatic agents", function() {
            Game.init();

            const myGame = new GameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            expect(myGame.agents.hasAgentProperty(dummy.id, "name")).to.be.true;
            expect(myGame.agents.hasAgentProperty(dummy.id, "health")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(dummy.id, "foo")).to.be.false;
        });

        it("Error check for InstanceAgents.hasAgentProperty with an invalid id", function() {
            Game.init();

            const myGame = new GameInstance();

            expect(() => myGame.agents.hasAgentProperty(1, "foo")).to.throw(
                RegalError,
                "No agent with the id <1> exists."
            );
        });

        it("InstanceAgents.deleteAgentProperty works properly for static agents", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(DUMMY);

            myGame.agents.deleteAgentProperty(d.id, "name");
            myGame.agents.deleteAgentProperty(d.id, "foo");

            expect("name" in d).to.be.false;
            expect(d.name).to.be.undefined;
            expect("health" in d).to.be.true;

            expect("name" in new GameInstance().using(DUMMY)).to.be.true;
        });

        it("InstanceAgents.deleteAgentProperty works properly for nonstatic agents", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            myGame.agents.deleteAgentProperty(d.id, "name");
            myGame.agents.deleteAgentProperty(d.id, "foo");

            expect("name" in d).to.be.false;
            expect(d.name).to.be.undefined;
            expect("health" in d).to.be.true;
        });

        it("Error check for InstanceAgents.deleteAgentProperty refuse delete of id", function() {
            Game.init();

            const myGame = new GameInstance();

            const dummy = myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.deleteAgentProperty(dummy.id, "id")
            ).to.throw(
                RegalError,
                "The agent's <id> property cannot be deleted."
            );
        });

        it("Error check for InstanceAgents.deleteAgentProperty refuse delete of game", function() {
            Game.init();

            const myGame = new GameInstance();

            const dummy = myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.deleteAgentProperty(dummy.id, "game")
            ).to.throw(
                RegalError,
                "The agent's <game> property cannot be deleted."
            );
        });

        it("Error check for InstanceAgents.deleteAgentProperty with an invalid id", function() {
            Game.init();

            const myGame = new GameInstance();

            expect(() => myGame.agents.deleteAgentProperty(1, "foo")).to.throw(
                RegalError,
                "No agent with the id <1> exists."
            );
        });

        it("InstanceAgents.getAgentManager returns the correct agent manager", function() {
            Game.init();

            const myGame = new GameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            expect(
                myGame.agents.getAgentManager(d.id).getProperty("name")
            ).to.equal("D1");
        });

        it("InstanceAgents.getAgentManager returns undefined for an illegal property", function() {
            Game.init();

            const myGame = new GameInstance();

            expect(myGame.agents.getAgentManager(-1)).to.be.undefined;
        });
    });

    describe("StaticAgentRegistry", function() {
        it("StaticAgentRegistry.getNextAvailableId increments by 1 for each static agent", function() {
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(1);

            const D = new Dummy("D1", 10);
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(2);

            const P = new Parent(D);
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(3);

            const P2 = new Parent(new Dummy("D2", 5));
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(5);
        });

        it("StaticAgentRegistry.hasAgentProperty works properly", function() {
            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry.hasAgentProperty(D.id, "name")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.id, "health")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.id, "foo")).to.be
                .false;
        });

        it("StaticAgentRegistry.hasAgentProperty only returns true for properties that were added in the static context", function() {
            const D = new Dummy("D1", 10);
            (D as any).foo = true;

            Game.init();
            const d = new GameInstance().using(D);

            (d as any).bar = true;

            expect(StaticAgentRegistry.hasAgentProperty(D.id, "name")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.id, "health")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.id, "foo")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.id, "bar")).to.be
                .false;
        });

        it("StaticAgentRegistry.getAgentProperty works properly for literals and objects", function() {
            const D = new Dummy("D1", 10);
            const P = new Parent(D);

            expect(StaticAgentRegistry.getAgentProperty(D.id, "name")).to.equal(
                "D1"
            );
            expect(
                StaticAgentRegistry.getAgentProperty(D.id, "health")
            ).to.equal(10);
            expect(StaticAgentRegistry.getAgentProperty(D.id, "foo")).to.be
                .undefined;
            expect(
                StaticAgentRegistry.getAgentProperty(P.id, "child")
            ).to.equal(D);
        });

        it("Error check for StaticAgentRegistry.getAgentProperty with an invalid id", function() {
            expect(() =>
                StaticAgentRegistry.getAgentProperty(0, "foo")
            ).to.throw(
                RegalError,
                "No agent with the id <0> exists in the static registry."
            );
        });

        it("StaticAgentRegistry.hasAgent works properly", function() {
            expect(StaticAgentRegistry.hasAgent(1)).to.be.false;

            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry.hasAgent(1)).to.be.true;

            Game.init();

            const p = new GameInstance().using(new Parent(D));

            expect(StaticAgentRegistry.hasAgent(p.id)).to.be.false;
        });

        it("StaticAgentRegistry.addAgent is called implicitly", function() {
            expect(StaticAgentRegistry.hasAgent(1)).to.be.false;

            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry[1]).to.deep.equal(D);
        });

        it("StaticAgentRegistry.addAgent blocks an illegal id", function() {
            expect(() => StaticAgentRegistry.addAgent({ id: 23 })).to.throw(
                RegalError,
                "Expected an agent with id <1>."
            );
        });

        it("StaticAgentRegistry.reset removes all agents and resets the agent count", function() {
            const D = new Dummy("D1", 10);
            const P = new Parent(new Dummy("D2", 25));

            expect(StaticAgentRegistry.hasAgent(1)).to.be.true;
            expect(StaticAgentRegistry.hasAgent(2)).to.be.true;
            expect(StaticAgentRegistry.hasAgent(3)).to.be.true;
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(4);

            StaticAgentRegistry.reset();

            expect(StaticAgentRegistry.hasAgent(1)).to.be.false;
            expect(StaticAgentRegistry.hasAgent(2)).to.be.false;
            expect(StaticAgentRegistry.hasAgent(3)).to.be.false;
            expect(StaticAgentRegistry.getNextAvailableId()).to.equal(1);
        });
    });

    describe("Reverting", function() {
        it("Reverting the effects of many events back to the first one", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
                return noop;
            });

            const mod = (num: number) =>
                on(`MOD ${num}`, game => {
                    game.state.foo += `-${num}`;
                    game.state[num] = `Yo ${num}`;
                    return noop;
                });

            Game.init();

            const myGame = new GameInstance({ trackAgentChanges: true });
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

            const revert = buildRevertFunction(myGame.agents, 1);
            revert(myGame);

            expect(myGame.state.foo).to.equal("Hello, world!");
            expect(myGame.state[0]).to.be.undefined;
            expect(myGame.state[5]).to.be.undefined;
            expect(myGame.state[9]).to.be.undefined;
        });

        it("Reverting the effects of many events over multiple steps", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
                return noop;
            });

            const mod = (num: number) =>
                on(`MOD ${num}`, game => {
                    game.state.foo += `-${num}`;
                    game.state[num] = `Yo ${num}`;
                    return noop;
                });

            Game.init();

            const myGame = new GameInstance({ trackAgentChanges: true });
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

            buildRevertFunction(myGame.agents, 8)(myGame);

            expect(myGame.state.foo).to.equal("Hello, world!-0-1-2-3-4-5-6");
            expect(myGame.state[0]).to.equal("Yo 0");
            expect(myGame.state[5]).to.equal("Yo 5");
            expect(myGame.state[9]).to.be.undefined;

            buildRevertFunction(myGame.agents, 6)(myGame);

            expect(myGame.state.foo).to.equal("Hello, world!-0-1-2-3-4");
            expect(myGame.state[0]).to.equal("Yo 0");
            expect(myGame.state[5]).to.be.undefined;
            expect(myGame.state[9]).to.be.undefined;

            buildRevertFunction(myGame.agents, 4)(myGame);

            expect(myGame.state.foo).to.equal("Hello, world!-0-1-2");
            expect(myGame.state[0]).to.equal("Yo 0");
            expect(myGame.state[5]).to.be.undefined;
            expect(myGame.state[9]).to.be.undefined;

            buildRevertFunction(myGame.agents, 1)(myGame);

            expect(myGame.state.foo).to.equal("Hello, world!");
            expect(myGame.state[0]).to.be.undefined;
            expect(myGame.state[5]).to.be.undefined;
            expect(myGame.state[9]).to.be.undefined;
        });

        it("Reverting to before an agent was registered", function() {
            const init = on("INIT", game => {
                game.state.foo = "Hello, world!";
                game.state.dummy = new Dummy("Lars", 10);
                return noop;
            });

            Game.init();

            const myGame = new GameInstance();
            init(myGame);
            buildRevertFunction(myGame.agents, 0)(myGame);

            expect(myGame.state.foo).to.be.undefined;
            expect(myGame.state.dummy).to.be.undefined;
            expect(myGame.agents.getAgentProperty(1, "name")).to.be.undefined;
            expect(myGame.agents.getAgentProperty(1, "health")).to.be.undefined;
        });

        it("Reverting changes to static agents", function() {
            const staticDummy = new Dummy("Lars", 15);

            Game.init();

            const myGame = new GameInstance();
            on("FUNC", game => {
                const dummy = game.using(staticDummy);
                dummy.name = "Jimbo";
                dummy["bippity"] = "boppity";
                return noop;
            })(myGame);

            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Jimbo");
            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(15);
            expect(myGame.agents.getAgentProperty(1, "bippity")).to.equal(
                "boppity"
            );

            buildRevertFunction(myGame.agents)(myGame);

            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Lars");
            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(15);
            expect(myGame.agents.getAgentProperty(1, "bippity")).to.be
                .undefined;
        });
    });
});
