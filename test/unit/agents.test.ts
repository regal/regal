import { expect } from "chai";
import "mocha";

import { MetadataManager } from "../../src/config";
import { getDemoMetadata } from "../test-utils";
import { Game } from "../../src/game-api";
import { Agent } from "../../src/agents";
import GameInstance from "../../src/game-instance";
import { RegalError } from "../../src/error";

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

        it.only("Active agents can have circular references to each other", function() {
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
    });
});
