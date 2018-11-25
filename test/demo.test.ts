import { expect } from "chai";
import "mocha";

import { Game, on, Agent, onStartCommand, onPlayerCommand, noop } from "../src";
import { log, getDemoMetadata } from "./test-utils";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

describe("Demo", function() {
    after(function() {
        Game.reset();
    });

    it("Demo Runthrough Test 1", function() {
        const _oracle = new Dummy("The Almighty Oracle", 1000);

        const consultOracle = on("CONSULT", game => {
            const oracle = game.using(_oracle);
            game.output.write(`${oracle.name} says: "Bow down before me!"`);
        });

        const die = on("DIE", game => {
            game.output.write(`${game.using(_oracle)} dies!`);
        });

        const attack = (name: string) =>
            on("ATTACK", game => {
                const _dummy = new Dummy(`The Brave ${name}`, 400);
                const attacker = game.using(_dummy);
                const oracle = game.using(_oracle);

                if ("attackers" in game.state) {
                    game.state.attackers += `,${attacker.name}`;
                } else {
                    game.state.attackers = attacker.name;
                }

                game.output.write(
                    `${attacker.name} attacks ${
                        oracle.name
                    }, reducing its health from ${
                        oracle.health
                    } to ${oracle.health - attacker.health}.`
                );
                game.output.write(
                    `${attacker.name} dies in the process. A true hero!`
                );

                oracle.health -= attacker.health;

                if (oracle.health <= 0) {
                    return die;
                }

                return noop;
            });

        onStartCommand(consultOracle);
        onPlayerCommand(command => game => {
            return consultOracle.then(attack(command));
        });

        Game.init(getDemoMetadata());

        let response = Game.postStartCommand();
        // log(response);

        // console.log("\n\n");

        response = Game.postPlayerCommand(response.instance, "Jeff");
        // log(response);

        // console.log("\n\n");

        response = Game.postPlayerCommand(response.instance, "Lars II");
        // log(response);
    });
});
