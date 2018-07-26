import { expect } from 'chai';
import 'mocha';

import { GameInstance } from '../src/game';
import { Agent, staticAgentRegistry, StaticAgentRegistry } from '../src/agent';

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Agent", () => {

    describe("Making a static agent", () => {

        it("The static agent registry has no agents to begin with", () => {
            expect(staticAgentRegistry.agentCount).to.equal(0); // TODO - why is this failing
        });

        const dummy = new Dummy("D1", 10).static();
        
        it("The static agent has the correct properties", () => {
            expect(dummy.id).to.equal(1);
            expect(dummy.game).to.be.undefined;
            expect(dummy.name).to.equal("D1");
            expect(dummy.health).to.equal(10);
            expect(dummy.isStatic).to.be.true;
            expect(dummy.isRegistered).to.be.false;
        });

        it("The static agent is in the registry", () => {
            expect(staticAgentRegistry.agentCount).to.equal(1);

            expect(staticAgentRegistry.hasAgent(dummy.id)).to.be.true;
            expect(staticAgentRegistry.hasAgentProperty(dummy.id, "name")).to.be.true;
            expect(staticAgentRegistry.hasAgentProperty(1, "health")).to.be.true;

            expect(staticAgentRegistry.getAgentProperty(1, "name")).to.equal("D1");
            expect(staticAgentRegistry.getAgentProperty(dummy.id, "health")).to.equal(10);
        });

        it("The static agent registry doesn't have any false positives", () => {
            expect(staticAgentRegistry.hasAgent(0)).to.be.false;
            expect(staticAgentRegistry.hasAgent(2)).to.be.false;
            expect(staticAgentRegistry.hasAgentProperty(dummy.id, "non")).to.be.false;
            expect(staticAgentRegistry.hasAgentProperty(2, "name")).to.be.false;
        });

    });

});

