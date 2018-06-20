import {GameInstance} from '../../src/gameInstance';
import {EventFunction, track} from '../../src/event';

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
// Args: source (ICanHit), target (ITargetable), object (IHitObject)
// Pipe to DAMAGE

//** 4 DAMAGE */
// Args: subject (IDamageable), damage (int)
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
