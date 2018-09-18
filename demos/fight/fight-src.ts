import { Agent, noop, on, RegalError } from "../../src";

// Demonstrate:
// Events, Custom Agents, Output, Event Queueing

// Events:
// addEnemy
// attack
// getHurt
// creatureDie
// changeScore
// startGame
// endGame

// Agents:
// creature

class Creature extends Agent {
    constructor(
        public name: string,
        public health: number,
        public isAlive: boolean,
        public damage: number
    ) {
        super();
    }
}

interface FightState {
    score: number;
    player: Creature;
}

const stateHasCreature = (state: FightState, name: string) =>
    state.hasOwnProperty(name) && !["score", "player"].includes(name);

const getHurt = (target: Creature, amount: number) =>
    on("GET HURT", game => {
        const state = game.state as FightState;

        return noop; // todo
    });

const attack = (targetName: string) =>
    on("ATTACK", game => {
        const state = game.state as FightState;

        if (stateHasCreature(state, name)) {
            throw new RegalError("There's no-one with that name!");
        }

        const target = game.state[targetName] as Creature;

        if (!target.isAlive) {
            throw new RegalError(
                "You can't attack something that's already dead!"
            );
        }

        game.output.write(`${state.player.name} attacks ${target.name}.`);

        return getHurt(target, state.player.damage);
    });
