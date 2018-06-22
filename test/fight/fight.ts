import { GameInstance } from '../../src/gameInstance';
import { EventFunction, on, queue } from '../../src/event';
// import { EventFunction, on, noop, ifType, tryCast, queue } from '../../src/event';

// 1. INPUT causes ATTACK
// 2. ATTACK causes HIT
// 3. HIT causes DAMAGE
// 4. DAMAGE causes DEATH
// 5. DEATH causes DROP[item]
// 6. DEATH causes FALL[orc]
// 7. DROP[item] causes LAND[item]
// 8. FALL[orc] causes LAND[orc]

// 1 INPUT - direct
// 2 ATTACK - direct
// 3 HIT - direct
// 4 DAMAGE - direct
// 5 DEATH - direct
// 6 DROP[item] - queued by 5
// 7 FALL[orc] - queued by 5
// 8 LAND[item] - queued by 6
// 9 LAND[orc] - queued by 7

//** 1 INPUT */
// Args: input (string)
// Pipe to ATTACK

//** 2 ATTACK */
// Args: attacker (ICanAttack), target (IAttackable), object (IAttackObject)
// Pipe to HIT

//** 3 HIT */
// Args: source (ICanHit), target (IHittable)
// Pipe to DAMAGE

//** 4 DAMAGE */
// Args: subject (IHittable), damage (int)
// Pipe to DEATH

//** 5 DEATH */
// Args: subject (ICanDie)
// Queue DROP[item], FALL[orc]

//** 6 DROP[item] */
// Args: subject (ICanDrop), target (IDroppable)
// Queue LAND[item]

//** 7 FALL[orc] */
// Args: subject (ICanFall)
// Queue LAND[orc]

//** 8 LAND[item] */
// Args: subject (ICanFall)
// END

//** 9 Land[orc] */
// Args: subject (ICanFall)
// END



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
interface IAttackObject extends ICanHit {
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
    canAttack: boolean;
    canBlock: boolean;
    health: number;
    defense: number;
    dieBehaviors: DieBehavior[];
    items: IHoldable[];
    weight: number;

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
                game.output.push(`${target.name} blocks ${attacker.name}'s ${object.name}.`);
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

const knightArmor = new Armor("Shining armor");
const sword = new MeleeWeapon("Broadsword", 15);
const knight = Creature.Human("Knight", [knightArmor, sword]);

const orcArmor = new Armor("Rusted armor");
const club = new MeleeWeapon("Club", 5);
const orc = Creature.Orc("Orc", [orcArmor, club]);

const game = new GameInstance();

console.log("Hello, World!");

attack(knight, orc, sword) (game);
attack(knight, orc, sword) (game);
console.log(game);
