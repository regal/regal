import { expect } from "chai";
import "mocha";

import { MetadataManager } from "../../src/config";
import { getDemoMetadata, log } from "../test-utils";
import { Game } from "../../src/game-api";
import { Agent, PropertyOperation } from "../../src/agents";
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
            expect(dr.propertyWasDeleted("foo3")).to.be.false; // TODO - fix
        });
    });
});
