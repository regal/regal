import {GameInstance} from '../../src/gameInstance';
import {EventFunction, track, noop} from '../../src/event';

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


interface INamed {
    name: string;
}

interface ICanHit extends INamed {
    damage: number;
    hitVerb: string;
}

interface ICanAttack extends INamed {
    canAttack: boolean;
}

interface IHittable extends INamed {
    health: number;
    defense: number;
}

interface IAttackable extends IHittable {
    canBlock: boolean;
}

interface ICanDie extends INamed {
    dieBehaivor: DieBehavior;
}

interface IAttackObject extends ICanHit {
    damageType: DamageType;
    attackVerb: string;
}

class GameObject implements INamed {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

class MeleeWeapon extends GameObject implements IAttackObject {
    damageType = DamageType.MELEE;
    attackVerb = "swing";
    hitVerb = "strike";

    damage: number;

    constructor(name: string, damage: number) {
        super(name);
        this.damage = damage;
    }
}

const sword: MeleeWeapon = new MeleeWeapon("Broadsword", 15);

const attack = (attacker: ICanAttack, target: IAttackable, object: IAttackObject) =>
    track("ATTACK", game => {

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
    track("HIT", game => {
        const damageAmount = source.damage - target.defense;

        game.output.push(`${source.name} ${source.hitVerb}s ${target.name}`);
        return damage(target, damageAmount) (game); //todo
});

const damage = (subject: IHittable, damage: number) =>
    track("DAMAGE", game => {
        subject.health = Math.max(subject.health - damage, 0);

        game.output.push(`${subject.name} takes ${damage} damage, reducing its health to ${subject.health}.`);

        let doIfCanDie = function(obj: any, positiveFunc: (x: ICanDie) => any) {
            if ((<ICanDie>obj).dieBehaivor !== undefined) {
                return positiveFunc(<ICanDie>obj);
            }
        }

        let doIfType = function<T, U>(obj: any, typeName: string, acceptFunc: (x: T) => U, defaultFunc: (x: any) => U) {
            if (typeof obj === typeName) {
                return acceptFunc(<T>obj);
            } else {
                return defaultFunc(obj);
            }
        }

        if (subject.health == 0) {
            // return doIfCanDie(subject, death) (game);
            return doIfType(subject, "ICanDie", death, noop) (game);
        }
        return game;
});

const death = (subject: ICanDie) =>
    track("DEATH", game => {
        return game;
});