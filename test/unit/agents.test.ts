import { expect } from "chai";
import "mocha";

import {
    getDemoMetadata,
    log,
    Dummy,
    makeAgents,
    smartObjectEquals,
    TestProperty,
    aPKs,
    ePKs,
    testMeta,
    smartObj
} from "../test-utils";
import { Game } from "../../src/api";
import {
    Agent,
    PropertyOperation,
    StaticAgentRegistry,
    getGameInstancePK
} from "../../src/agents";
import { RegalError } from "../../src/error";
import { DEFAULT_EVENT_NAME, getUntrackedEventPK } from "../../src/events";
import { on } from "../../src/events";
import { buildGameInstance } from "../../src/state";
import {
    STATIC_AGENT_PK_PROVIDER,
    getInactiveAgentPK
} from "../../src/agents/impl";
import { ReservedAgentProperty } from "../../src/agents/agent-meta";
import {
    defaultAgentMeta,
    staticAgentMeta,
    inactiveAgentMeta,
    agentMetaWithID
} from "../../src/agents/impl/agent-meta-transformers";

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

class MultiParent extends Agent {
    constructor(public children: Dummy[]) {
        super();
    }
}

const MD = getDemoMetadata();

describe("Agents", function() {
    afterEach(function() {
        Game.reset();
    });

    describe("Basic Usage", function() {
        it("Retrieve the initial properties of an active agent within a game cycle", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
        });

        it("Modify the properties of an active agent within a game cycle", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            dummy.health += 15;
            dummy["foo"] = "bar";

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(25);
            expect(dummy["foo"]).to.equal("bar");
        });

        it("Check the existence of an active agent's properties within a game cycle", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            delete dummy.health;

            expect("name" in dummy).to.be.true;
            expect("health" in dummy).to.be.false;
        });

        it("The properties of an inactive agent cannot be read during a game cycle", function() {
            Game.init(MD);

            const _dummy = new Dummy("D1", 10);

            expect(() => _dummy.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be accessed within a game cycle."
            );
        });

        it("The properties of an inactive agent can only be set once during a game cycle", function() {
            Game.init(MD);

            const _dummy = new Dummy("D1", 10);

            expect(() => (_dummy.health = 23)).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be set within a game cycle."
            );
        });

        it("The properties of an inactive agent cannot be deleted during a game cycle", function() {
            Game.init(MD);

            const _dummy = new Dummy("D1", 10);

            expect(() => delete _dummy.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be deleted within a game cycle."
            );
        });

        it("Retrieve the initial properties of an active static agent within a game cycle", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();
            const dummy = myGame.using(DUMMY);

            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
        });

        it("Modifying the initial properties of an active static agent within a game cycle does not change the original", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const game1 = buildGameInstance();
            const dummy1 = game1.using(DUMMY);

            dummy1.health += 15;
            dummy1["foo"] = "bar";

            expect(dummy1.name).to.equal("D1");
            expect(dummy1.health).to.equal(25);
            expect("foo" in dummy1).to.be.true;
            expect(dummy1["foo"]).to.equal("bar");

            const game2 = buildGameInstance();
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

            Game.init(MD);

            const myGame = buildGameInstance();
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

            Game.init(MD);

            expect(() => DUMMY.health).to.throw(
                RegalError,
                "The properties of an inactive agent cannot be accessed within a game cycle."
            );
        });

        it("Modifying the properties of an inactive static agent inside the game cycle is not allowed", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            expect(() => (DUMMY.health = 5)).to.throw(
                RegalError,
                "This static agent must be activated before it may be modified."
            );
        });
    });

    describe("Advanced Usage", function() {
        it("Active agents can have references to each other", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const parent = myGame.using(new Parent(new Dummy("D1", 10)));
            expect(parent.child.name).to.equal("D1");
            expect(parent.child.health).to.equal(10);
        });

        it("Modifying properties through an active agent reference", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
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
            Game.init(MD);

            const myGame = buildGameInstance();
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
            Game.init(MD);

            const myGame = buildGameInstance();
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

            Game.init(MD);

            const myGame = buildGameInstance();
            const parent = myGame.using(PARENT);

            expect(parent.child.name).to.equal("D1");
            expect(parent.child.health).to.equal(10);
        });

        it("Modifying active static agents through references", function() {
            const PARENT = new Parent(new Dummy("D1", 10));

            Game.init(MD);

            const myGame = buildGameInstance();
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

            Game.init(MD);

            const myGame = buildGameInstance();

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

            Game.init(MD);

            const myGame = buildGameInstance();

            const sib1 = myGame.using(SIB_1);

            expect(sib1.name).to.equal("Billy");
            expect(sib1.sibling.name).to.equal("Bob");
            expect(sib1.sibling.sibling.name).to.equal("Billy");
        });

        it("Modifying static agent properties through circular references", function() {
            const SIB_1 = new Sibling("Billy");
            const SIB_2 = new Sibling("Bob", SIB_1);
            SIB_1.sibling = SIB_2;

            Game.init(MD);

            const myGame = buildGameInstance();

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

            Game.init(MD);

            const myGame = buildGameInstance();

            const parent = myGame.using(new Parent(CHILD));

            expect(parent.child.name).to.equal("Bab");
            expect(parent.child.health).to.equal(1);
        });

        it("Modifying a static agent that's a property of an active agent", function() {
            const CHILD = new Dummy("Bab", 1);

            Game.init(MD);

            const myGame1 = buildGameInstance();
            const parent1 = myGame1.using(new Parent(CHILD));

            const myGame2 = buildGameInstance();
            const parent2 = myGame2.using(new Parent(CHILD));

            parent1.child.health += 15;
            parent2.child.name = "Jenkins";

            expect(parent1.child.name).to.equal("Bab");
            expect(parent1.child.health).to.equal(16);

            expect(parent2.child.name).to.equal("Jenkins");
            expect(parent2.child.health).to.equal(1);
        });

        it("Activating an agent multiple times returns a reference to the same agent", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

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

            Game.init(MD);

            const myGame = buildGameInstance();

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
            Game.init(MD);

            const myGame = buildGameInstance();

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

            Game.init(MD);

            const myGame = buildGameInstance();

            const { d, p } = myGame.using({ d: DUMMY, p: PARENT });
            p.child.health += 5;

            expect(d.name).to.equal("D1");
            expect(d.health).to.equal(20);
            expect(p.child.name).to.equal("D1");
            expect(p.child.health).to.equal(20);
            expect(myGame.agents.agentManagers().length).to.equal(2);
        });

        it("Activating multiple agents as a safety at the beginning of events", function() {
            interface S {
                parent: Parent;
            }

            const newChild = (_target: Parent) =>
                on<S>("NEW CHILD", game => {
                    const { parent, child } = game.using({
                        parent: _target,
                        child: new Dummy("D1", 10)
                    });

                    parent.child = child;
                    game.state.parent = parent;
                });

            const PARENT = new Parent(new Dummy("D0", 0));

            Game.init(MD);

            // Using a static agent that hasn't been activated
            const myGame1 = buildGameInstance<S>();
            newChild(PARENT)(myGame1);

            expect(
                myGame1.state.parent.child.meta.id.equals(
                    getGameInstancePK().plus(3)
                )
            ).to.be.true;
            expect(myGame1.state.parent.child.name).to.equal("D1");
            expect(myGame1.state.parent.child.health).to.equal(10);

            // Using a nonstatic agent that's been activated
            const myGame2 = buildGameInstance<S>();
            const myParent = myGame2.using(new Parent(new Dummy("D2", 2)));
            newChild(myParent)(myGame2);

            expect(
                myGame2.state.parent.child.meta.id.equals(
                    getGameInstancePK().plus(5)
                )
            ).to.be.true;
            expect(myGame2.state.parent.child.name).to.equal("D1");
            expect(myGame2.state.parent.child.health).to.equal(10);

            // Using a nonstatic agent that hasn't been activated
            const myGame3 = buildGameInstance<S>();
            const myParent2 = new Parent(undefined);
            newChild(myParent2)(myGame3);

            expect(
                myGame3.state.parent.child.meta.id.equals(
                    getGameInstancePK().plus(4)
                )
            ).to.be.true;
            expect(myGame3.state.parent.child.name).to.equal("D1");
            expect(myGame3.state.parent.child.health).to.equal(10);
        });

        describe("Agent Arrays", function() {
            it("Setting an active agent's property to be an empty array is functional", function() {
                Game.init(MD);

                const myGame = buildGameInstance();
                on("MOD", game => {
                    game.state.arr = [];
                })(myGame);

                expect(myGame.state.arr).to.deep.equal([]);
            });

            it("Setting an active agent's property to be an empty array is tracked properly", function() {
                Game.init(MD);

                const myGame = buildGameInstance({ trackAgentChanges: true });
                on("MOD", game => {
                    game.state.arr = [];
                })(myGame);

                const [pk0, pk1] = aPKs(1);
                const epk1 = getUntrackedEventPK().plus(1);

                smartObjectEquals(myGame.agents, {
                    _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                    game: myGame,
                    [pk0.value()]: smartObj({
                        meta: testMeta(pk0),
                        game: myGame,
                        arr: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk1 }
                            }
                        ]
                    }),
                    [pk1.value()]: smartObj({
                        meta: testMeta(pk1),
                        game: myGame,
                        length: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 0
                            }
                        ]
                    })
                });
                expect(myGame.events.history).to.deep.equal([
                    {
                        id: epk1,
                        name: "MOD",
                        changes: [
                            {
                                agentId: pk1,
                                property: "length",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 0
                            },
                            {
                                agentId: pk0,
                                property: "arr",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk1 }
                            }
                        ]
                    }
                ]);
            });

            it("Setting an active agent's property to be an array of primitives is functional", function() {
                Game.init(MD);

                const myGame = buildGameInstance();
                on("MOD", game => {
                    game.state.arr = [1, false, "foo"];
                })(myGame);

                expect(myGame.state.arr).to.deep.equal([1, false, "foo"]);
            });

            it("Setting an active agent's property to be an array of primitives is tracked properly", function() {
                Game.init(MD);

                const myGame = buildGameInstance({ trackAgentChanges: true });
                on("MOD", game => {
                    game.state.arr = [1, false, "foo"];
                })(myGame);

                const [pk0, pk1] = aPKs(1);
                const epk1 = getUntrackedEventPK().plus(1);

                smartObjectEquals(myGame.agents, {
                    _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                    _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                    game: myGame,
                    [pk0.value()]: smartObj({
                        meta: testMeta(pk0),
                        game: myGame,
                        arr: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk1 }
                            }
                        ]
                    }),
                    [pk1.value()]: smartObj({
                        meta: testMeta(pk1),
                        game: myGame,
                        length: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 3
                            }
                        ],
                        0: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 1
                            }
                        ],
                        1: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: false
                            }
                        ],
                        2: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: "foo"
                            }
                        ]
                    })
                });
                expect(myGame.events.history).to.deep.equal([
                    {
                        id: epk1,
                        name: "MOD",
                        changes: [
                            {
                                agentId: pk1,
                                property: "0",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 1
                            },
                            {
                                agentId: pk1,
                                property: "1",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: false
                            },
                            {
                                agentId: pk1,
                                property: "2",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: "foo"
                            },
                            {
                                agentId: pk1,
                                property: "length",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 3
                            },
                            {
                                agentId: pk0,
                                property: "arr",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk1 }
                            }
                        ]
                    }
                ]);
            });

            it("Setting an active agent's property to be an array of activated agents is functional", function() {
                Game.init(MD);

                const myGame = buildGameInstance();
                const { d1, d2, d3 } = myGame.using({
                    d1: new Dummy("D1", 5),
                    d2: new Dummy("D2", 10),
                    d3: new Dummy("D3", 15)
                });
                on("MOD", game => {
                    game.state.arr = [d1, d2, d3];
                })(myGame);

                expect(myGame.state.arr).to.deep.equal([d1, d2, d3]);
            });

            it("Setting an active agent's property to be an array of activated agents is tracked properly", function() {
                Game.init(MD);

                const myGame = buildGameInstance({ trackAgentChanges: true });
                const { d1, d2, d3 } = myGame.using({
                    d1: new Dummy("D1", 5),
                    d2: new Dummy("D2", 10),
                    d3: new Dummy("D3", 15)
                });
                on("MOD", game => {
                    game.state.arr = [d1, d2, d3];
                })(myGame);

                const [pk0, pk1, pk2, pk3, pk4] = aPKs(4);
                const [epk0, epk1] = ePKs(1);

                smartObjectEquals(myGame.agents, {
                    _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                    _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                    game: myGame,
                    [pk0.value()]: smartObj({
                        meta: testMeta(pk0),
                        game: myGame,
                        arr: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk4 }
                            }
                        ]
                    }),
                    [pk1.value()]: smartObj({
                        meta: testMeta(pk1),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: "D1"
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 5
                            }
                        ]
                    }),
                    [pk2.value()]: smartObj({
                        meta: testMeta(pk2),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: "D2"
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 10
                            }
                        ]
                    }),
                    [pk3.value()]: smartObj({
                        meta: testMeta(pk3),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: "D3"
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 15
                            }
                        ]
                    }),
                    [pk4.value()]: smartObj({
                        meta: testMeta(pk4),
                        game: myGame,
                        length: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 3
                            }
                        ],
                        0: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk1 }
                            }
                        ],
                        1: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk2 }
                            }
                        ],
                        2: [
                            {
                                eventId: epk1,
                                eventName: "MOD",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk3 }
                            }
                        ]
                    })
                });
                expect(myGame.events.history).to.deep.equal([
                    {
                        id: epk1,
                        name: "MOD",
                        changes: [
                            {
                                agentId: pk4,
                                property: "0",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk1 }
                            },
                            {
                                agentId: pk4,
                                property: "1",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk2 }
                            },
                            {
                                agentId: pk4,
                                property: "2",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { refId: pk3 }
                            },
                            {
                                agentId: pk4,
                                property: "length",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: 3
                            },
                            {
                                agentId: pk0,
                                property: "arr",
                                op: PropertyOperation.ADDED,
                                init: undefined,
                                final: { arRefId: pk4 }
                            }
                        ]
                    }
                ]);
            });

            it("Setting an active agent's property to be an array of inactive agents is implicitly activates them", function() {
                Game.init(MD);

                interface S {
                    arr: Dummy[];
                }

                const myGame = buildGameInstance<S>();
                on<S>("MOD", game => {
                    game.state.arr = [new Dummy("D1", 10), new Dummy("D2", 15)];
                })(myGame);

                const d1 = myGame.state.arr[0];
                const d2 = myGame.state.arr[1];

                const [_pk0, _pk1, pk2, pk3] = aPKs(3);

                expect(d1.meta.id.equals(pk2)).to.be.true;
                expect(d1.name).to.equal("D1");
                expect(d1.health).to.equal(10);
                expect(d2.meta.id.equals(pk3)).to.be.true;
                expect(d2.name).to.equal("D2");
                expect(d2.health).to.equal(15);
            });

            it("Setting a static agent's property to an array of other static agents is functional", function() {
                const d1 = new Dummy("D1", 10);
                const d2 = new Dummy("D2", 15);
                d2["dummies"] = [d1, d2];

                Game.init(MD);

                const myGame = buildGameInstance();
                on("MOD", game => {
                    game.state.dummy = d2;
                })(myGame);

                expect(myGame.state.dummy.dummies[0]).to.deep.equal(
                    myGame.using(d1)
                );
                expect(myGame.state.dummy.dummies[1].name).to.equal("D2");
                smartObjectEquals(myGame.state.dummy.dummies[1].dummies[0], {
                    meta: testMeta(getGameInstancePK().plus(1)),
                    name: "D1",
                    health: 10
                });
            });

            it("Setting an agent's property to an array of static agents is functional", function() {
                const d1 = new Dummy("D1", 10);
                const d2 = new Dummy("D2", 15);

                Game.init(MD);

                const myGame = buildGameInstance();
                on("MOD", game => {
                    game.state.dummies = [d1, d2];
                })(myGame);

                const [_pk0, pk1, pk2] = aPKs(2);

                const expectedVal = [
                    smartObj({ meta: testMeta(pk1), name: "D1", health: 10 }),
                    smartObj({ meta: testMeta(pk2), name: "D2", health: 15 })
                ];
                (expectedVal as any).meta = TestProperty.REQUIRE_BUT_SKIP;

                smartObjectEquals(myGame.state.dummies, expectedVal);
            });

            it("Array.prototype.unshift is functional on agent arrays", function() {
                Game.init(MD);

                const myGame = buildGameInstance();
                myGame.state.dummies = [
                    new Dummy("D1", 10),
                    new Dummy("D2", 15)
                ];
                myGame.state.dummies.unshift(new Dummy("D3", 15));

                const [_pk0, _pk1, pk2, pk3, pk4] = aPKs(4);

                expect(
                    myGame.state.dummies.map(dummy => ({
                        id: dummy.meta.id,
                        name: dummy.name,
                        health: dummy.health
                    }))
                ).to.deep.equal([
                    { id: pk4, name: "D3", health: 15 },
                    { id: pk2, name: "D1", health: 10 },
                    { id: pk3, name: "D2", health: 15 }
                ]);
            });

            it("Array.prototype.concat is functional on agent arrays", function() {
                Game.init(MD);
                const myGame = buildGameInstance();

                myGame.state.vals1 = [true, new Dummy("D1", 10)];
                myGame.state.vals2 = [
                    "hello",
                    new Dummy("D2", 15),
                    myGame.state.vals1[1]
                ];
                myGame.state.allVals = myGame.state.vals1.concat(
                    myGame.state.vals2
                );

                const pk2 = getGameInstancePK().plus(2);
                const pk4 = pk2.plus(2);

                smartObjectEquals(
                    [...myGame.state.allVals],
                    [
                        true,
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        }),
                        "hello",
                        smartObj({
                            meta: testMeta(pk4),
                            name: "D2",
                            health: 15
                        }),
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        })
                    ]
                );
            });

            it("Length property of agent arrays is functional", function() {
                Game.init(MD);
                const myGame = buildGameInstance();

                myGame.state.arr = [];
                expect(myGame.state.arr.length).to.equal(0);

                myGame.state.arr.push(1);
                myGame.state.arr.push(2);
                expect(myGame.state.arr.length).to.equal(2);

                expect(myGame.state.arr.shift()).to.equal(1);
                expect(myGame.state.arr.length).to.equal(1);
            });

            it("Modifying an agent's properties through an agent array is functional", function() {
                Game.init(MD);
                const myGame = buildGameInstance();

                on("FOO", game => {
                    const arr = myGame.using([new Dummy("D1", 15)]);
                    arr[0].health *= 2;
                    delete arr[0].name;
                    (arr[0] as any).foo = true;
                    game.state.arr = arr;
                })(myGame);

                smartObjectEquals(
                    [...myGame.state.arr],
                    [
                        smartObj({
                            meta: testMeta(getGameInstancePK().plus(2)),
                            health: 30,
                            foo: true
                        })
                    ]
                );
            });

            it("Multi-dimensional agent arrays are functional", function() {
                Game.init(MD);
                const myGame = buildGameInstance();

                const arr = myGame.using([makeAgents(10, 5)]);

                const [_pk0, pk1, pk2, pk3, pk4, pk5, pk6, pk7, pk8] = aPKs(8);

                const expectedInnerArray = [
                    smartObj({
                        meta: testMeta(pk3),
                        name: "D10",
                        health: 10
                    }),
                    smartObj({
                        meta: testMeta(pk4),
                        name: "D11",
                        health: 11
                    }),
                    smartObj({
                        meta: testMeta(pk5),
                        name: "D12",
                        health: 12
                    }),
                    smartObj({
                        meta: testMeta(pk6),
                        name: "D13",
                        health: 13
                    }),
                    smartObj({
                        meta: testMeta(pk7),
                        name: "D14",
                        health: 14
                    })
                ] as any;
                expectedInnerArray.meta = testMeta(pk2);
                const expectedOuterArray = [
                    smartObj(expectedInnerArray)
                ] as any;
                expectedOuterArray.meta = testMeta(pk1);

                smartObjectEquals(arr, expectedOuterArray);
                expect(arr.length).to.equal(1);
                expect(arr[0].length).to.equal(5);
                expect((arr as any).meta.id.equals(pk1)).to.be.true;

                arr.push(makeAgents(16, 10));

                smartObjectEquals(myGame.agents.getAgentManager(pk1), {
                    meta: testMeta(pk1),
                    game: myGame,
                    0: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: "DEFAULT",
                            final: {
                                arRefId: pk2
                            },
                            init: undefined,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    1: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: "DEFAULT",
                            final: {
                                arRefId: pk8
                            },
                            init: undefined,
                            op: PropertyOperation.ADDED
                        }
                    ],
                    length: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: "DEFAULT",
                            final: 2,
                            init: 1,
                            op: PropertyOperation.MODIFIED
                        }
                    ]
                });

                smartObjectEquals(arr[1].find(dummy => dummy.health % 9 == 0), {
                    meta: testMeta(pk8.plus(3)),
                    name: "D18",
                    health: 18
                });
            });

            it("Multi-dimensional agent arrays are tracked properly", function() {
                Game.init(MD);
                const myGame = buildGameInstance({ trackAgentChanges: true });

                const arr = myGame.using([makeAgents(0, 2)]);
                arr.unshift(makeAgents(3, 4));
                myGame.state.arr = arr;

                const [pk0, pk1, pk2, pk3, pk4, pk5, pk6, pk7, pk8, pk9] = aPKs(
                    9
                );
                const epk0 = getUntrackedEventPK();

                smartObjectEquals(myGame.agents, {
                    _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                    _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                    game: myGame,
                    [pk0.value()]: smartObj({
                        meta: testMeta(pk0),
                        game: myGame,
                        arr: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: {
                                    arRefId: pk1
                                },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk1.value()]: smartObj({
                        meta: testMeta(pk1),
                        game: myGame,
                        0: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: {
                                    arRefId: pk5
                                },
                                init: {
                                    arRefId: pk2
                                },
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: {
                                    arRefId: pk2
                                },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        1: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: {
                                    arRefId: pk2
                                },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        length: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 2,
                                init: 1,
                                op: PropertyOperation.MODIFIED
                            },
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 1,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk2.value()]: smartObj({
                        meta: testMeta(pk2),
                        game: myGame,
                        0: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk3 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        1: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk4 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        length: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 2,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk3.value()]: smartObj({
                        meta: testMeta(pk3),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D0",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 0,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk4.value()]: smartObj({
                        meta: testMeta(pk4),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D1",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 1,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk5.value()]: smartObj({
                        meta: testMeta(pk5),
                        game: myGame,
                        0: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk6 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        1: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk7 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        2: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk8 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        3: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: { refId: pk9 },
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        length: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 4,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk6.value()]: smartObj({
                        meta: testMeta(pk6),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D3",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 3,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk7.value()]: smartObj({
                        meta: testMeta(pk7),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D4",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 4,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk8.value()]: smartObj({
                        meta: testMeta(pk8),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D5",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 5,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    }),
                    [pk9.value()]: smartObj({
                        meta: testMeta(pk9),
                        game: myGame,
                        name: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: "D6",
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ],
                        health: [
                            {
                                eventId: epk0,
                                eventName: DEFAULT_EVENT_NAME,
                                final: 6,
                                init: undefined,
                                op: PropertyOperation.ADDED
                            }
                        ]
                    })
                });
            });

            it("Static agents with agent arrays as properties are functional", function() {
                const d2 = new Dummy("D2", 10);
                const p = new MultiParent([new Dummy("D1", 10), d2]);
                const q = new MultiParent(p.children);

                const [pk0, pk1, pk2] = aPKs(2);

                smartObjectEquals(
                    [...p.children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        }),
                        smartObj({
                            meta: testMeta(pk1),
                            name: "D2",
                            health: 10
                        })
                    ]
                );

                Game.init(MD);

                const myGame1 = buildGameInstance();
                const p1 = myGame1.using(p);
                const c = p1.children;

                c.pop().name += " Jr.";

                smartObjectEquals(
                    [...p1.children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        })
                    ]
                );
                smartObjectEquals(
                    [...myGame1.using(q).children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        })
                    ]
                );
                smartObjectEquals(myGame1.using(d2), {
                    meta: testMeta(pk1),
                    name: "D2 Jr.",
                    health: 10
                });

                const myGame2 = buildGameInstance();
                const p2 = myGame2.using(p);
                p2.children.push(new Dummy("D3", 5), d2);

                smartObjectEquals(
                    [...p2.children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        }),
                        smartObj({
                            meta: testMeta(pk1),
                            name: "D2",
                            health: 10
                        }),
                        smartObj({
                            meta: testMeta(pk0.plus(6)),
                            name: "D3",
                            health: 5
                        }),
                        smartObj({
                            meta: testMeta(pk1),
                            name: "D2",
                            health: 10
                        })
                    ]
                );
                expect(myGame2.using(q).children).to.deep.equal(p2.children);

                // Verify that initial conditions still hold
                smartObjectEquals(
                    [...buildGameInstance().using(p).children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        }),
                        smartObj({
                            meta: testMeta(pk1),
                            name: "D2",
                            health: 10
                        })
                    ]
                );
                smartObjectEquals(
                    [...buildGameInstance().using(q).children],
                    [
                        smartObj({
                            meta: testMeta(pk2),
                            name: "D1",
                            health: 10
                        }),
                        smartObj({
                            meta: testMeta(pk1),
                            name: "D2",
                            health: 10
                        })
                    ]
                );
            });

            it("An agent array's keys enumerate properly", function() {
                Game.init(MD);

                const a = buildGameInstance().using([1, 2, 3]);
                expect(Object.keys(a)).to.deep.equal([
                    "0",
                    "1",
                    "2",
                    ReservedAgentProperty.META
                ]);
            });

            it("Adding an agent to an array via Array.prototype.push activates the agent", function() {
                const myEvent = on("FOO", game => {
                    game.state.list = [];
                    game.state.list.push(new Dummy("D1", 10));
                });

                Game.init(MD);
                const myGame = buildGameInstance();
                myEvent(myGame);

                smartObjectEquals(
                    [...myGame.state.list],
                    [
                        smartObj({
                            meta: testMeta(getGameInstancePK().plus(2)),
                            name: "D1",
                            health: 10
                        })
                    ]
                );
                expect(
                    myGame.agents.getAgentProperty(
                        getGameInstancePK().plus(2),
                        "name"
                    )
                ).to.equal("D1");
            });
        });

        describe("Methods and Inheritance", function() {
            class ArrayGetterAgent extends Agent {
                public dummy1 = new Dummy("D1", 10);
                public dummy2 = new Dummy("D2", 20);

                public getList() {
                    return [this.dummy1, this.dummy2];
                }
            }

            it("An agent subclass may have a method which returns an array of its properties, which are also agents", function() {
                Game.init(MD);

                const myGame = buildGameInstance();
                const ag = myGame.using(new ArrayGetterAgent());

                const props = [];
                for (const d of ag.getList()) {
                    props.push(d.name);
                }

                expect(props).to.deep.equal(["D1", "D2"]);
            });
        });
    });

    describe("Agent Managers", function() {
        it("The AgentManager's id matches the agent's id", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(d.meta.id).to.equal(dr.meta.id);
        });

        it("The AgentManager's id matches the game instance", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.game).to.equal(myGame);
        });

        it("AgentManager.hasPropertyRecord returns correct values", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.meta.id);

            delete d.health;

            expect(dr.hasPropertyRecord("name")).to.be.true;
            expect(dr.hasPropertyRecord("health")).to.be.true;
            expect(dr.hasPropertyRecord("foo")).to.be.false;
        });

        it("AgentManager.hasPropertyRecord returns false for properties only in the static agent", function() {
            const DUMMY = new Dummy("D1", 15);

            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(DUMMY);
            d.health += 15;

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.hasPropertyRecord("name")).to.be.false;
            expect(dr.hasPropertyRecord("health")).to.be.true;
        });

        it("AgentManager.hasPropertyRecord returns false for 'constructor', as this causes confusion", function() {
            Game.init(MD);
            expect(
                buildGameInstance()
                    .agents.getAgentManager(getGameInstancePK())
                    .hasPropertyRecord("constructor")
            ).to.be.false;
        });

        it("AgentManager.getProperty returns the most recent property", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            d.health += 15;

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.getProperty("name")).to.equal("D1");
            expect(dr.getProperty("health")).to.equal(30);
            expect(dr.getProperty("foo")).to.be.undefined;
        });

        it("AgentManager.getPropertyHistory returns the array of PropertyChanges", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.meta.id);
            const [epk0, epk1] = ePKs(1);

            const addHealth = (dummy: Dummy) =>
                on("ADD HEALTH", game => {
                    dummy.health += 15;
                });

            addHealth(d)(myGame);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: epk0,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);

            expect(dr.getPropertyHistory("health")).to.deep.equal([
                {
                    eventId: epk1,
                    eventName: "ADD HEALTH",
                    op: PropertyOperation.MODIFIED,
                    init: 15,
                    final: 30
                },
                {
                    eventId: epk0,
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

            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(DUMMY);

            delete (d as any).foo;

            const addHealth = (dummy: Dummy) =>
                on("ADD HEALTH", game => {
                    dummy.health += 15;
                });

            addHealth(d)(myGame);

            const dr = myGame.agents.getAgentManager(d.meta.id);
            const [epk0, epk1] = ePKs(1);

            expect(dr.getPropertyHistory("name")).to.deep.equal([]);
            expect(dr.getPropertyHistory("health")).to.deep.equal([
                {
                    eventId: epk1,
                    eventName: "ADD HEALTH",
                    op: PropertyOperation.MODIFIED,
                    init: 15,
                    final: 30
                }
            ]);
            expect(dr.getPropertyHistory("foo")).to.deep.equal([
                {
                    eventId: epk0,
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.DELETED,
                    init: "bar",
                    final: undefined
                }
            ]);
        });

        it("AgentManager.propertyWasDeleted returns true for real properties that were deleted", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(DUMMY);

            delete d.name;

            delete d.health;
            d.health = 15;

            (d as any).foo1 = "bar";

            (d as any).foo2 = "baz";
            delete (d as any).foo2;

            delete (d as any).foo3;

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.propertyWasDeleted("name")).to.be.true;
            expect(dr.propertyWasDeleted("health")).to.be.false;
            expect(dr.propertyWasDeleted("foo1")).to.be.false;
            expect(dr.propertyWasDeleted("foo2")).to.be.true;
            expect(dr.propertyWasDeleted("foo3")).to.be.false;
        });

        it("AgentManager does not add a record for setting a property to the same value", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            d.name = "D1";

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: getUntrackedEventPK(),
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });

        it("AgentManager does not add a record for setting a property to its static value", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(DUMMY);

            d.name = "D1";

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([]);
        });

        it("AgentManager does not add a record for deleting a property multiple times", function() {
            Game.init(MD);

            const myGame = buildGameInstance({ trackAgentChanges: true });
            const d = myGame.using(new Dummy("D1", 10));

            d.name = "D1";
            delete d.name;
            delete d.name;

            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.getPropertyHistory("name")).to.deep.equal([
                {
                    eventId: getUntrackedEventPK(),
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.DELETED,
                    init: "D1",
                    final: undefined
                },
                {
                    eventId: getUntrackedEventPK(),
                    eventName: DEFAULT_EVENT_NAME,
                    op: PropertyOperation.ADDED,
                    init: undefined,
                    final: "D1"
                }
            ]);
        });

        it("AgentManager.id is a getter for AgentManager.meta.id", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(new Dummy("D1", 15));
            const dr = myGame.agents.getAgentManager(d.meta.id);

            expect(dr.id).to.equal(dr.meta.id);
        });
    });

    describe("InstanceAgents", function() {
        it("InstanceAgents.recycle creates all new agents that have only the last values of each of the original agent' properties", function() {
            Game.init(MD);

            const myGame = buildGameInstance({ trackAgentChanges: true });

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                });
            })(myGame);

            const [pk0, pk1] = aPKs(1);
            const [epk0, epk1, epk2] = ePKs(2);

            // Verify initial condition
            smartObjectEquals(myGame.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: myGame,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: myGame,
                    dummy: [
                        {
                            eventId: epk1,
                            eventName: "INIT",
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: epk2,
                            eventName: "MOD",
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: myGame,
                    name: [
                        {
                            eventId: epk2,
                            eventName: "MOD",
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
                        },
                        {
                            eventId: epk1,
                            eventName: "INIT",
                            init: undefined,
                            final: "D1",
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: epk1,
                            eventName: "INIT",
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                })
            });

            const myGame2 = myGame.recycle();

            smartObjectEquals(myGame2.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: myGame2,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: myGame2,
                    dummy: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: myGame2,
                    name: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: "Jimmy",
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                })
            });
        });

        it("InstanceAgents.recycle creates all new agents that have only the last values of each of the original agent' properties (without tracking agent properties)", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                });
            })(myGame);

            const [pk0, pk1] = aPKs(1);
            const [epk0, epk1, epk2] = ePKs(2);

            // Verify initial condition
            smartObjectEquals(myGame.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: myGame,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: myGame,
                    dummy: [
                        {
                            eventId: epk1,
                            eventName: "INIT",
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: epk2,
                            eventName: "MOD",
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: myGame,
                    name: [
                        {
                            eventId: epk2,
                            eventName: "MOD",
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
                        }
                    ],
                    health: [
                        {
                            eventId: epk1,
                            eventName: "INIT",
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                })
            });

            const myGame2 = myGame.recycle();

            smartObjectEquals(myGame2.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: myGame2,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: myGame2,
                    dummy: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: myGame2,
                    name: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: "Jimmy",
                            op: PropertyOperation.ADDED
                        }
                    ],
                    health: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                })
            });
        });

        it("InstanceAgents.recycle copies only the properties of static agents that are different than their initial values", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            on("INIT", game => {
                game.state.dummy = DUMMY;

                return on("MOD", game => {
                    game.state.dummy.name = "Jimmy";
                    game.state.foo = true;
                });
            })(myGame);

            const [pk0, pk1] = aPKs(1);
            const epk0 = getUntrackedEventPK();

            const game2 = myGame.recycle();

            smartObjectEquals(game2.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: game2,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: game2,
                    dummy: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ],
                    foo: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: true,
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: game2,
                    name: [
                        {
                            eventId: epk0,
                            eventName: DEFAULT_EVENT_NAME,
                            init: "D1",
                            final: "Jimmy",
                            op: PropertyOperation.MODIFIED
                        }
                    ]
                })
            });
        });

        it("InstanceAgents.recycle does not copy the properties of non-static agents that were most recently deleted", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            on("INIT", game => {
                game.state.dummy = new Dummy("D1", 10);

                return on("MOD", game => {
                    delete game.state.dummy.name;
                    delete game.state.foo;
                });
            })(myGame);

            const game2 = myGame.recycle();

            const [pk0, pk1] = aPKs(1);

            smartObjectEquals(game2.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: game2,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: game2,
                    dummy: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: game2,
                    health: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: 10,
                            op: PropertyOperation.ADDED
                        }
                    ]
                })
            });
        });

        it("InstanceAgents.recycle DOES copy the properties of STATIC agents that were most recently deleted", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            on("INIT", game => {
                game.state.dummy = DUMMY;

                return on("MOD", game => {
                    delete game.state.dummy.name;
                });
            })(myGame);

            const game2 = myGame.recycle();

            const [pk0, pk1] = aPKs(1);

            smartObjectEquals(game2.agents, {
                _pkProvider: TestProperty.REQUIRE_BUT_SKIP,
                _prototypeRegistry: TestProperty.REQUIRE_BUT_SKIP,
                game: game2,
                [pk0.value()]: smartObj({
                    meta: testMeta(pk0),
                    game: game2,
                    dummy: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: DEFAULT_EVENT_NAME,
                            init: undefined,
                            final: {
                                refId: pk1
                            },
                            op: PropertyOperation.ADDED
                        }
                    ]
                }),
                [pk1.value()]: smartObj({
                    meta: testMeta(pk1),
                    game: game2,
                    name: [
                        {
                            eventId: getUntrackedEventPK(),
                            eventName: DEFAULT_EVENT_NAME,
                            init: "D1",
                            final: undefined,
                            op: PropertyOperation.DELETED
                        }
                    ]
                })
            });
        });

        it("InstanceAgents.reserveNextId starts after the highest static agent and then counts up", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            expect(myGame.agents.reserveNewId().equals(DUMMY.meta.id.plus(1)))
                .to.be.true;
            expect(myGame.agents.reserveNewId().equals(DUMMY.meta.id.plus(2)))
                .to.be.true;
        });

        it("InstanceAgents.getAgentProperty gets the correct property from either the instance or static registry", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(DUMMY);
            d.health = 0;
            d.health += 5;
            (d as any).foo = true;

            expect(myGame.agents.getAgentProperty(d.meta.id, "name")).to.equal(
                "D1"
            );
            expect(
                myGame.agents.getAgentProperty(d.meta.id, "health")
            ).to.equal(5);
            expect(myGame.agents.getAgentProperty(d.meta.id, "foo")).to.be.true;
        });

        it("If the static agent hasn't been modified, InstanceAgents.getAgentProperty will call the static registry directly", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            const d = myGame.using(DUMMY);

            expect(myGame.agents.getAgentProperty(d.meta.id, "name")).to.equal(
                "D1"
            );
            expect(myGame.agents.getAgentProperty(d.meta.id, "bad")).to.be
                .undefined;
            expect(
                myGame.agents
                    .agentManagers()
                    .map(manager => manager.meta.id)
                    .includes(d.meta.id)
            ).to.be.false; // There isn't an agent manager for this agent
        });

        it("Error check for InstanceAgents.getAgentProperty with an invalid id", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const pk1 = getGameInstancePK().plus(1);

            expect(() => myGame.agents.getAgentProperty(pk1, "foo")).to.throw(
                RegalError,
                `No agent with the id <${pk1.value()}> exists.`
            );
        });

        it("InstanceAgents.getAgentProperty returns undefined for an non-existent agent property", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            expect(
                myGame.agents.getAgentProperty(
                    getGameInstancePK().plus(1),
                    "foo"
                )
            ).to.be.undefined;
        });

        it("InstanceAgents.getAgentProperty returns an agent proxy when the value of the static agent's property is an agent", function() {
            const DUMMY = new Dummy("D1", 10);
            const PARENT = new Parent(DUMMY);

            Game.init(MD);

            const myGame = buildGameInstance();
            const p = myGame.using(PARENT);

            const child = myGame.agents.getAgentProperty(
                getGameInstancePK().plus(2),
                "child"
            );
            smartObjectEquals(child, {
                meta: testMeta(getGameInstancePK().plus(1)),
                name: "D1",
                health: 10
            });
            expect(child.meta.id).to.equal(DUMMY.meta.id);
            expect(child.name).to.equal("D1");
        });

        it("InstanceAgents.setAgentProperty works properly", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            myGame.agents.setAgentProperty(d.meta.id, "name", "Lars");

            expect(d.name).to.equal("Lars");
        });

        it("InstanceAgents.setAgentProperty implicitly activates an agent", function() {
            const SIB = new Sibling("Billy");

            Game.init(MD);

            const myGame = buildGameInstance();

            myGame.agents.setAgentProperty(
                getGameInstancePK().plus(1),
                "sibling",
                new Sibling("Bob", SIB)
            );

            expect(myGame.agents.agentManagers().length).to.equal(3); // State, SIB, SIB's sibling
            expect(myGame.using(SIB).sibling.name).to.equal("Bob");
            expect(buildGameInstance().using(SIB).sibling).to.be.undefined;
        });

        it("Error check InstanceAgents.setAgentProperty with meta", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.setAgentProperty(
                    getGameInstancePK().plus(1),
                    ReservedAgentProperty.META,
                    2
                )
            ).to.throw(
                RegalError,
                "The agent's <meta> property cannot be set."
            );
        });

        it("Error check InstanceAgents.setAgentProperty with game", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.setAgentProperty(
                    getGameInstancePK().plus(1),
                    ReservedAgentProperty.GAME,
                    buildGameInstance()
                )
            ).to.throw(
                RegalError,
                "The agent's <game> property cannot be set."
            );
        });

        it("Error check InstanceAgents.setAgentProperty with an invalid id", function() {
            Game.init(MD);

            const pk1 = getGameInstancePK().plus(1);

            const myGame = buildGameInstance();
            expect(() =>
                myGame.agents.setAgentProperty(pk1, "foo", true)
            ).to.throw(`No agent with the id <${pk1.value()}> exists.`);
        });

        it("InstanceAgents.hasAgentProperty works properly with static agents", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "name")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "health")).to
                .be.true;
            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "foo")).to.be
                .false;
        });

        it("InstanceAgents.hasAgentProperty works properly with static agents that have been modified in the cycle", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();

            myGame.using(DUMMY).health += 15;

            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "name")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "health")).to
                .be.true;
            expect(myGame.agents.hasAgentProperty(DUMMY.meta.id, "foo")).to.be
                .false;
        });

        it("InstanceAgents.hasAgentProperty works properly with nonstatic agents", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const dummy = myGame.using(new Dummy("D1", 10));

            expect(myGame.agents.hasAgentProperty(dummy.meta.id, "name")).to.be
                .true;
            expect(myGame.agents.hasAgentProperty(dummy.meta.id, "health")).to
                .be.true;
            expect(myGame.agents.hasAgentProperty(dummy.meta.id, "foo")).to.be
                .false;
        });

        it("Error check for InstanceAgents.hasAgentProperty with an invalid id", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const pk1 = getGameInstancePK().plus(1);

            expect(() => myGame.agents.hasAgentProperty(pk1, "foo")).to.throw(
                RegalError,
                `No agent with the id <${pk1.value()}> exists.`
            );
        });

        it("InstanceAgents.deleteAgentProperty works properly for static agents", function() {
            const DUMMY = new Dummy("D1", 10);

            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(DUMMY);

            myGame.agents.deleteAgentProperty(d.meta.id, "name");
            myGame.agents.deleteAgentProperty(d.meta.id, "foo");

            expect("name" in d).to.be.false;
            expect(d.name).to.be.undefined;
            expect("health" in d).to.be.true;

            expect("name" in buildGameInstance().using(DUMMY)).to.be.true;
        });

        it("InstanceAgents.deleteAgentProperty works properly for nonstatic agents", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            myGame.agents.deleteAgentProperty(d.meta.id, "name");
            myGame.agents.deleteAgentProperty(d.meta.id, "foo");

            expect("name" in d).to.be.false;
            expect(d.name).to.be.undefined;
            expect("health" in d).to.be.true;
        });

        it("Error check for InstanceAgents.deleteAgentProperty refuse delete of meta", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const dummy = myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.deleteAgentProperty(
                    dummy.meta.id,
                    ReservedAgentProperty.META
                )
            ).to.throw(
                RegalError,
                "The agent's <meta> property cannot be deleted."
            );
        });

        it("Error check for InstanceAgents.deleteAgentProperty refuse delete of game", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            const dummy = myGame.using(new Dummy("D1", 10));

            expect(() =>
                myGame.agents.deleteAgentProperty(dummy.meta.id, "game")
            ).to.throw(
                RegalError,
                "The agent's <game> property cannot be deleted."
            );
        });

        it("Error check for InstanceAgents.deleteAgentProperty with an invalid id", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const pk1 = getGameInstancePK().plus(1);

            expect(() =>
                myGame.agents.deleteAgentProperty(pk1, "foo")
            ).to.throw(
                RegalError,
                `No agent with the id <${pk1.value()}> exists.`
            );
        });

        it("InstanceAgents.getAgentManager returns the correct agent manager", function() {
            Game.init(MD);

            const myGame = buildGameInstance();
            const d = myGame.using(new Dummy("D1", 10));

            expect(
                myGame.agents.getAgentManager(d.meta.id).getProperty("name")
            ).to.equal("D1");
        });

        it("InstanceAgents.getAgentManager returns undefined for an illegal property", function() {
            Game.init(MD);

            const myGame = buildGameInstance();

            expect(myGame.agents.getAgentManager(getGameInstancePK().minus(1)))
                .to.be.undefined;
        });
    });

    describe("StaticAgentRegistry", function() {
        it("STATIC_AGENT_PK_PROVIDER increments by 1 for each static agent added to the static registry", function() {
            const [_pk0, pk1, pk2, pk3, _pk4, pk5] = aPKs(5);

            expect(STATIC_AGENT_PK_PROVIDER.peek().equals(pk1)).to.be.true;

            const D = new Dummy("D1", 10);
            expect(STATIC_AGENT_PK_PROVIDER.peek().equals(pk2)).to.be.true;

            const P = new Parent(D);
            expect(STATIC_AGENT_PK_PROVIDER.peek().equals(pk3)).to.be.true;

            const P2 = new Parent(new Dummy("D2", 5));
            expect(STATIC_AGENT_PK_PROVIDER.peek().equals(pk5)).to.be.true;
        });

        it("StaticAgentRegistry.hasAgentProperty works properly", function() {
            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "name")).to
                .be.true;
            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "health")).to
                .be.true;
            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "foo")).to.be
                .false;
        });

        it("StaticAgentRegistry.hasAgentProperty only returns true for properties that were added in the static context", function() {
            const D = new Dummy("D1", 10);
            (D as any).foo = true;

            Game.init(MD);
            const d = buildGameInstance().using(D);

            (d as any).bar = true;

            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "name")).to
                .be.true;
            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "health")).to
                .be.true;
            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "foo")).to.be
                .true;
            expect(StaticAgentRegistry.hasAgentProperty(D.meta.id, "bar")).to.be
                .false;
        });

        it("StaticAgentRegistry.getAgentProperty works properly for literals and objects", function() {
            const D = new Dummy("D1", 10);
            const P = new Parent(D);

            expect(
                StaticAgentRegistry.getAgentProperty(D.meta.id, "name")
            ).to.equal("D1");
            expect(
                StaticAgentRegistry.getAgentProperty(D.meta.id, "health")
            ).to.equal(10);
            expect(StaticAgentRegistry.getAgentProperty(D.meta.id, "foo")).to.be
                .undefined;
            expect(
                StaticAgentRegistry.getAgentProperty(P.meta.id, "child")
            ).to.equal(D);
        });

        it("Error check for StaticAgentRegistry.getAgentProperty with an invalid id", function() {
            expect(() =>
                StaticAgentRegistry.getAgentProperty(getGameInstancePK(), "foo")
            ).to.throw(
                RegalError,
                `No agent with the id <${getGameInstancePK().value()}> exists in the static registry.`
            );
        });

        it("StaticAgentRegistry.hasAgent works properly", function() {
            expect(StaticAgentRegistry.hasAgent(getGameInstancePK().plus(1))).to
                .be.false;

            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry.hasAgent(getGameInstancePK().plus(1))).to
                .be.true;

            Game.init(MD);

            const p = buildGameInstance().using(new Parent(D));

            expect(StaticAgentRegistry.hasAgent(p.meta.id)).to.be.false;
        });

        it("StaticAgentRegistry.addAgent is called implicitly", function() {
            const pk1 = getGameInstancePK().plus(1);
            expect(StaticAgentRegistry.hasAgent(pk1)).to.be.false;

            const D = new Dummy("D1", 10);

            expect(StaticAgentRegistry[pk1.value()]).to.deep.equal(D);
        });

        it("StaticAgentRegistry.addAgent blocks an illegal id", function() {
            const pk = getGameInstancePK().plus(22);
            expect(() =>
                StaticAgentRegistry.addAgent({
                    meta: {
                        id: pk,
                        protoId: undefined
                    }
                })
            ).to.throw(
                RegalError,
                `Only inactive agents can be added to the static registry. This one already has an id of <${pk.value()}>.`
            );
        });

        it("StaticAgentRegistry.reset removes all agents and resets the static agent PK provider", function() {
            const D = new Dummy("D1", 10);
            const P = new Parent(new Dummy("D2", 25));

            const [_pk0, pk1, pk2, pk3] = aPKs(3);

            expect(StaticAgentRegistry.hasAgent(pk1)).to.be.true;
            expect(StaticAgentRegistry.hasAgent(pk2)).to.be.true;
            expect(StaticAgentRegistry.hasAgent(pk3)).to.be.true;
            expect(STATIC_AGENT_PK_PROVIDER.next().equals(pk3.plus(1))).to.be
                .true;

            StaticAgentRegistry.reset();

            expect(StaticAgentRegistry.hasAgent(pk1)).to.be.false;
            expect(StaticAgentRegistry.hasAgent(pk2)).to.be.false;
            expect(StaticAgentRegistry.hasAgent(pk3)).to.be.false;
            expect(STATIC_AGENT_PK_PROVIDER.next().equals(pk1)).to.be.true;
        });
    });

    describe("Scrubbing", function() {
        it("Scrubbing an InstanceAgents deletes all agents that have no references to them", function() {
            Game.init(MD);
            const myGame = buildGameInstance();

            myGame.state.dummy = new Parent(new Dummy("D1", 10));
            const float = myGame.using(new Dummy("D2", 15));

            const pks0_3 = aPKs(3);

            expect(
                myGame.agents.agentManagers().map(am => am.meta.id)
            ).to.deep.equal(pks0_3);
            smartObjectEquals(myGame.state.dummy, {
                meta: testMeta(pks0_3[1]),
                child: smartObj({
                    meta: testMeta(pks0_3[2]),
                    name: "D1",
                    health: 10
                })
            });
            expect(myGame.agents.getAgentProperty(pks0_3[3], "name")).to.equal(
                "D2"
            );

            myGame.agents.scrubAgents();

            expect(
                myGame.agents.agentManagers().map(am => am.meta.id)
            ).to.deep.equal(aPKs(2));
            smartObjectEquals(myGame.state.dummy, {
                meta: testMeta(pks0_3[1]),
                child: smartObj({
                    meta: testMeta(pks0_3[2]),
                    name: "D1",
                    health: 10
                })
            });

            expect(() =>
                myGame.agents.getAgentProperty(pks0_3[3], "name")
            ).to.throw(
                RegalError,
                `No agent with the id <${pks0_3[3].value()}> exists.`
            );
        });

        it("Scrubbing an InstanceAgents finds agent array references", function() {
            Game.init(MD);
            const myGame = buildGameInstance<{ arr: any[] }>();

            const p = myGame.using(
                new MultiParent([new Dummy("D1", 1), new Dummy("D2", 2)])
            );
            myGame.state.arr = [true, new Dummy("D3", 3), p, p.children[0]];

            const pks0_6 = aPKs(6);

            expect(
                myGame.agents.agentManagers().map(am => am.meta.id)
            ).to.deep.equal(pks0_6);
            smartObjectEquals(myGame.state.arr[3], {
                meta: testMeta(pks0_6[3]),
                name: "D1",
                health: 1
            });

            myGame.agents.scrubAgents();
            expect(
                myGame.agents.agentManagers().map(am => am.meta.id)
            ).to.deep.equal(pks0_6);

            myGame.state.arr.splice(2, 1);
            myGame.agents.scrubAgents();

            expect(
                myGame.agents.agentManagers().map(am => am.meta.id)
            ).to.deep.equal([pks0_6[0], pks0_6[3], pks0_6[5], pks0_6[6]]);
            smartObjectEquals(myGame.state.arr[2], {
                meta: testMeta(pks0_6[3]),
                name: "D1",
                health: 1
            });
        });
    });

    describe("AgentMeta", function() {
        it("defaultAgentMeta transformer", function() {
            expect(defaultAgentMeta()).to.deep.equal({
                id: undefined,
                protoId: undefined
            });
        });

        it("staticAgentMeta transformer", function() {
            const expectedId = STATIC_AGENT_PK_PROVIDER.peek();
            expect(staticAgentMeta(defaultAgentMeta()).id.equals(expectedId)).to
                .be.true;
        });

        it("inactiveAgentMeta transformer", function() {
            expect(
                inactiveAgentMeta(defaultAgentMeta()).id.equals(
                    getInactiveAgentPK()
                )
            ).to.be.true;
        });

        it("agentMetaWithID transformer", function() {
            const id = getGameInstancePK();
            expect(agentMetaWithID(id)(defaultAgentMeta()).id.equals(id)).to.be
                .true;
        });

        it("Agent meta transformers are pure functions", function() {
            const meta1 = defaultAgentMeta();

            const id2 = getGameInstancePK();
            const meta2 = agentMetaWithID(id2)(meta1);

            expect(meta1).to.not.deep.equal(meta2);
            expect(meta1.id).equals(undefined);
            expect(meta2.id.equals(id2)).to.be.true;
        });
    });
});
