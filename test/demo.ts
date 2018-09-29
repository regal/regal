import {
    Game,
    GameInstance,
    on,
    Agent,
    onStartCommand,
    noop,
    onPlayerCommand
} from "../src";
import { log, getDemoMetadata } from "./test-utils";
import { MetadataManager } from "../src/config";

class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

const _oracle = new Dummy("The Almighty Oracle", 1000);

const consultOracle = on("CONSULT", game => {
    const oracle = game.using(_oracle);
    game.output.write(`${oracle.name} says: "Bow down before me!"`);
    return noop;
});

const die = on("DIE", game => {
    game.output.write(`${game.using(_oracle)} dies!`);
    return noop;
});

const attack = (name: string) =>
    on("ATTACK", game => {
        const attacker = game.using(new Dummy(`The Brave ${name}`, 400));
        const oracle = game.using(_oracle);

        if (!game.state.hasOwnProperty("attackers")) {
            game.state.attackers = attacker.name;
        } else {
            game.state.attackers += `,${attacker.name}`;
        }

        game.output.write(
            `${attacker.name} attacks ${
                oracle.name
            }, reducing its health from ${oracle.health} to ${oracle.health -
                attacker.health}.`
        );
        game.output.write(`${attacker.name} dies in the process. A true hero!`);

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

MetadataManager.setMetadata(getDemoMetadata());
Game.init();

let response = Game.postStartCommand();
log(response);

console.log("\n\n");

response = Game.postPlayerCommand(response.instance, "Jeff");
log(response);
