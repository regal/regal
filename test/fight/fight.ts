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