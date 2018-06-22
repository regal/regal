import {GameInstance} from '../../src/gameInstance';
import {EventFunction, on, noop, ifType} from '../../src/event';

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

enum DamageType {
    MELEE
}

enum DieBehavior {
    DROP_ALL
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
    dieBehaivor: DieBehavior;
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

class MeleeWeapon extends GameObject implements IAttackObject, IHoldable {
    damageType = DamageType.MELEE;
    attackVerb = "swing";
    hitVerb = "strike";
    holdableType = HoldableType.HANDHELD;

    damage: number;

    constructor(name: string, damage: number) {
        super(name);
        this.damage = damage;
    }
}

class Armor extends GameObject implements IHoldable {
    holdableType: HoldableType.ARMOR;
}

class Creature extends GameObject implements ICanAttack, IAttackable, ICanDie, ICanHold {
    canAttack: boolean;
    canBlock: boolean;
    health: number;
    defense: number;
    dieBehaivor: DieBehavior;
    items: IHoldable[];

    static Orc(name: string, items: IHoldable[]): Creature {
        const c = new Creature(name);
        c.canAttack = true;
        c.canBlock = false;
        c.health = 25;
        c.defense = 1;
        c.dieBehaivor = DieBehavior.DROP_ALL;
        c.items = items;
        return c;
    }

    static Human(name: string, items: IHoldable[]): Creature {
        const c = new Creature(name);
        c.canAttack = true;
        c.canBlock = true;
        c.health = 50;
        c.defense = 10;
        c.dieBehaivor = DieBehavior.DROP_ALL;
        c.items = items;
        return c;
    }
}

const sword: MeleeWeapon = new MeleeWeapon("Broadsword", 15);
const armor: Armor = new Armor("Rusted armor");

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

        game.output.push(`${source.name} ${source.hitVerb}s ${target.name}`);
        return damage(target, damageAmount) (game);
});

const damage = (subject: IHittable, damage: number) =>
    on("DAMAGE", game => {
        subject.health = Math.max(subject.health - damage, 0);

        game.output.push(`${subject.name} takes ${damage} damage, reducing its health to ${subject.health}.`);

        if (subject.health == 0) {
            return ifType(subject, "ICanDie", death, noop) (game);
        }
        return game;
});

const death = (subject: ICanDie) =>
    on("DEATH", game => {
        game.output.push(`${subject.name} dies!`);

        let events: EventFunction[];

        if (subject.dieBehaivor === DieBehavior.DROP_ALL) {
            return ifType(subject, "ICanHold", (sub: ICanHold) => queue(sub.items.map(item => drop(sub, item))), noop) (game);
        }
        return game;
});

const queue = (funcs: EventFunction[]) => noop(); //todo

const drop = (subject: ICanHold, target: IHoldable) =>
    on("DROP", game => {
        return game;
});