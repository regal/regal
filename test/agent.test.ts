import { expect } from 'chai';
import 'mocha';

import { GameInstance, RegalError } from '../src/game';
import { Agent, resetRegistry, staticAgentRegistry } from '../src/agent';
import { log } from '../src/utils';
import { on } from '../src/event';

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Agent", function() {

    describe("Static Agents", function() {

        beforeEach(function() {
            resetRegistry();
        });

        it("The static agent registry has no agents to begin with", function() {
            expect(staticAgentRegistry.agentCount).to.equal(0);
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
    
            expect(staticAgentRegistry.agentCount).to.equal(1);
    
            expect(staticAgentRegistry.hasAgent(dummy.id)).to.be.true;
            expect(staticAgentRegistry.hasAgentProperty(dummy.id, "name")).to.be.true;
            expect(staticAgentRegistry.hasAgentProperty(1, "health")).to.be.true;
    
            expect(staticAgentRegistry.getAgentProperty(1, "name")).to.equal("D1");
            expect(staticAgentRegistry.getAgentProperty(dummy.id, "health")).to.equal(10);
        });
    
        it("The static agent registry doesn't have any false positives", function() {
            const dummy = new Dummy("D1", 10).static();
    
            expect(staticAgentRegistry.hasAgent(0)).to.be.false;
            expect(staticAgentRegistry.hasAgent(2)).to.be.false;
            expect(staticAgentRegistry.hasAgentProperty(dummy.id, "non")).to.be.false;
            expect(staticAgentRegistry.hasAgentProperty(2, "name")).to.be.false;
        });

        it("Cannot declare an agent static multiple times", function() {
            const dummy = new Dummy("D1", 10).static();

            expect(() => dummy.static()).to.throw(RegalError, "Cannot create more than one static version of an agent.");
        });

        it("Cannot create a static version of a registered agent.", function() {
            const dummy = new Dummy("D1", 10).register(new GameInstance());

            expect(() => dummy.static()).to.throw(RegalError, "Cannot create a static version of a registered agent.");
        });

        it("Error check for StaticAgentRegistry#getAgentProperty", function() {
            expect(() => 
                staticAgentRegistry.getAgentProperty(100, "foo")
            ).to.throw(RegalError, "No static agent with ID <100> exists in the registry.");
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
        })

        it("Modifying a registered static agent adds the property to the instance state", function() {
            const dummy = new Dummy("D1", 10).static();
            const myGame = new GameInstance();

            on("MODIFY", game => {
                const myDummy = dummy.register(game);
                myDummy.health += 15;
                myDummy.name = "Jeff";
                myDummy["newProp"] = "newValue";

                return game;
            })(myGame);

            expect(myGame.agents.getAgentProperty(1, "health")).to.equal(25);
            expect(myGame.agents.getAgentProperty(1, "name")).to.equal("Jeff");
            expect(myGame.agents.getAgentProperty(1, "newProp")).to.equal("newValue");
        });

        it("Modifying a registered static agent does not modify the one in the registry", function() {
            const dummy = new Dummy("D1", 10).static();
            const myGame = new GameInstance();

            on("MODIFY", game => {
                const myDummy = dummy.register(game);
                myDummy.health += 15;
                myDummy.name = "Jeff";
                myDummy["newProp"] = "newValue";

                return game;
            })(myGame);

            expect(staticAgentRegistry.getAgentProperty(1, "health")).to.equal(10);
            expect(staticAgentRegistry.getAgentProperty(1, "name")).to.equal("D1");
            expect(staticAgentRegistry.getAgentProperty(1, "newProp")).to.be.undefined;
        });
    });
});

