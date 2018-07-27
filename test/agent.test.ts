import { expect } from 'chai';
import 'mocha';

import { GameInstance } from '../src/game';
import { Agent, resetRegistry, staticAgentRegistry } from '../src/agent';
import { log } from '../src/utils';

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
    });
});

