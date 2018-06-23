import { GameInstance } from '../../src/gameInstance';
import { EventFunction, on, queue, runQueue } from '../../src/event';
import { Game, RegalError, ErrorCode } from '../../src/game';

// AGENTS //

enum DamageType {
    MELEE
}

enum DieBehavior {
    DROP_ALL, FALL
}

enum HoldableType {
    HANDHELD, ARMOR
}

// Agent with a name.
interface INamed {
    name: string;
}

// Agent that can damage another agent.
interface ICanHit extends INamed {
    damage: number;
    hitVerb: string;
}

// Agent that can initiate an attack with another agent.
interface ICanAttack extends INamed {
    canAttack: boolean;
    equippedWeapon: IAttackObject;
}

// Agent that can be hit by an `ICanHit` agent.
interface IHittable extends INamed {
    health: number;
    defense: number;
}

// Agent that can be attacked by an `ICanAttack` agent.
interface IAttackable extends IHittable {
    canBlock: boolean;
}

// Agent that can die.
interface ICanDie extends INamed {
    dieBehaviors: DieBehavior[];
}

// Agent that can be used by an `ICanAttack` agent to attack an `IAttackable` agent.
interface IAttackObject extends ICanHit, IHoldable {
    damageType: DamageType;
    attackVerb: string;
}

// Agent that can hold one or more `IHoldable` agents.
interface ICanHold extends INamed {
    items: IHoldable[];
}

// Agent that can be held by an `ICanHold` agent.
interface IHoldable extends INamed {
    holdableType: HoldableType;
}

// Agent that is affected by gravity.
interface IPhysical extends INamed {
    weight: number;
}

class GameObject implements INamed {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

class MeleeWeapon extends GameObject implements IAttackObject, IHoldable, IPhysical {
    damageType = DamageType.MELEE;
    attackVerb = "swing";
    hitVerb = "strike";
    holdableType = HoldableType.HANDHELD;
    weight = 5;

    damage: number;

    constructor(name: string, damage: number) {
        super(name);
        this.damage = damage;
    }
}

class Armor extends GameObject implements IHoldable, IPhysical {
    holdableType: HoldableType.ARMOR;
    weight = 8;
}

class Creature extends GameObject implements ICanAttack, IAttackable, ICanDie, ICanHold, IPhysical {
    name: string;
    canAttack: boolean;
    canBlock: boolean;
    health: number;
    defense: number;
    dieBehaviors: DieBehavior[];
    items: IHoldable[];
    weight: number;
    equippedWeapon: IAttackObject;

    equip(weapon: IAttackObject) {
        if (!this.items.includes(weapon)) {
            this.items.push(weapon);
        }

        this.equippedWeapon = weapon;
    }

    static Orc(name: string, items: IHoldable[]): Creature {
        const c = new Creature(name);
        c.canAttack = true;
        c.canBlock = false;
        c.health = 25;
        c.defense = 1;
        c.dieBehaviors = [DieBehavior.DROP_ALL, DieBehavior.FALL];
        c.items = items;
        c.weight = 15;
        return c;
    }

    static Human(name: string, items: IHoldable[]): Creature {
        const c = new Creature(name);
        c.canAttack = true;
        c.canBlock = true;
        c.health = 50;
        c.defense = 10;
        c.dieBehaviors = [DieBehavior.DROP_ALL, DieBehavior.FALL];
        c.items = items;
        c.weight = 20;
        return c;
    }
}

// TYPECHECKS //

function canDie(obj: any): obj is ICanDie {
    return (<ICanDie>obj).dieBehaviors !== undefined;
}

function canHold(obj: any): obj is ICanHold {
    return (<ICanHold>obj).items !== undefined;
}

function isPhysical(obj: any): obj is IPhysical {
    return (<IPhysical>obj).weight !== undefined;
}

// EVENTS //

const attack = (attacker: ICanAttack, target: IAttackable, object: IAttackObject) =>
    on("ATTACK", game => {

        if (attacker.canAttack) {

            if (target.canBlock) {
                game.output.push(`${attacker.name} attempts to ${object.attackVerb} their ${object.name} at ${target.name}, who blocks it.`);
                return game;
            } 
            else {
                game.output.push(`${attacker.name} ${object.attackVerb}s their ${object.name} at ${target.name}.`);
                return hit(object, target) (game);
            }
        }

        game.output.push(`${attacker.name} attempts to ${object.attackVerb} their ${object.name}, but fails.`);
        return game;
});

const hit = (source: ICanHit, target: IHittable) =>
    on("HIT", game => {
        const damageAmount = source.damage - target.defense;

        game.output.push(`${source.name} ${source.hitVerb}s ${target.name}.`);
        return damage(target, damageAmount) (game);
});

const damage = (subject: IHittable, damage: number) =>
    on("DAMAGE", game => {
        subject.health = Math.max(subject.health - damage, 0);

        game.output.push(`${subject.name} takes ${damage} damage, reducing its health to ${subject.health}.`);

        if (subject.health === 0 && canDie(subject)) {
            return death(subject) (game);
        }
        return game;
});

const death = (subject: ICanDie) =>
    on("DEATH", game => {
        game.output.push(`${subject.name} dies!`);

        let events = [];

        if (subject.dieBehaviors.includes(DieBehavior.DROP_ALL) && canHold(subject)) {
            events = events.concat(subject.items.map(item => drop(subject, item)))
        }

        if (subject.dieBehaviors.includes(DieBehavior.FALL) && isPhysical(subject)) {
            events.push(fall(subject));
        }

        return queue(...events) (game);
});

const drop = (subject: ICanHold, target: IHoldable) =>
    on("DROP", game => {
        game.output.push(`${subject.name} drops their ${target.name}.`);
        return isPhysical(target) ? queue(fall(target)) (game) : game;
});

const fall = (subject: IPhysical) =>
    on("FALL", game => {
        const loudness = (subject.weight > 10) ? 'deafening' : 'loud';
        game.output.push(`${subject.name} hits the ground with a ${loudness} thud.`);
        return game;
});

// GAME //

interface FightState {
    knight: Creature;
    orc: Creature;
}

const checkState = (state: any): state is FightState => {
    return (<FightState>state).knight !== undefined;
}

export const init = () => {

    Game.onGameStart = () => {
        const game = new GameInstance();

        const knightArmor = new Armor("Shining armor");
        const sword = new MeleeWeapon("Broadsword", 15);
        const knight = Creature.Human("Knight", [knightArmor, sword]);
        knight.equip(sword);

        const orcArmor = new Armor("Rusted armor");
        const club = new MeleeWeapon("Club", 5);
        const orc = Creature.Orc("Orc", [orcArmor, club]);
        orc.equip(club);

        game.state = {knight, orc} as FightState;
        game.output.push("The knight and orc are in a standoff, sizing each other up.")

        return game;
    }

    Game.onUserInput = (content: string, game: GameInstance) => {
        if (checkState(game.state)) {
            let event: EventFunction;

            switch (content.toLowerCase()) {
                case "knight":
                    event = attack(game.state.knight, game.state.orc, game.state.knight.equippedWeapon);
                    break;

                case "orc":
                    event = attack(game.state.orc, game.state.knight, game.state.orc.equippedWeapon);
                    break;

                default:
                    game.output.push("Sorry, that input doesn't make sense.");
                    return game;
            }

            return runQueue(event(game)); // Execute all events in queue after the initial event
        } 
        else {
            throw new RegalError(ErrorCode.INVALID_STATE, "Input state is not of the correct form.")
        }
    };

    console.log("Fight initialized.");
}
