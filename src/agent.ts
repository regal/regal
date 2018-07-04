import { RegalError, ErrorCode, GameInstance, Game } from "./game";

const uidGenerator = {
    _uid: 0,
    next: function() {
        this._uid += 1;
        return this._uid;
    }
}

export const isPrefab = Symbol("isPrefab");
export const instanceId = Symbol("instanceId");
export const prefabId = Symbol("prefabId");
export const agent = Symbol("agent");

export class Agent {
    [prefabId]: number = -1;
    [instanceId]: number = -1;

    constructor(public name: string) {
        return new Proxy(this, {
            get: (target: this, property: PropertyKey) => {
                if (property in target) {
                    if (property === prefabId && !target[isPrefab]) {
                        throw new RegalError(ErrorCode.INVALID_STATE, `${target.constructor.name} has no prefabId, as it is not associated with a prefab.`);
                    } else if (property === instanceId && target[instanceId] <= 0) {
                        throw new RegalError(ErrorCode.INVALID_STATE, `${target.constructor.name} has no instanceId.`);
                    }
                }
                return Reflect.get(target, property);
            }
        })
    }

    get [isPrefab](): boolean {
        return this[prefabId] > 0;
    }

    prefab(): this {
        if (this[isPrefab]) {
            throw new RegalError(ErrorCode.INVALID_STATE, "Agent is already a prefab.");
        }

        this[prefabId] = Game.addPrefab(this);

        return new Proxy(this, {
            // get: (target: this, property: PropertyKey) => {
            //     return Reflect.get(target, property);
            // },

            set: (target: this, property: PropertyKey, value: any) => {
                throw new RegalError(ErrorCode.INVALID_STATE, `Could not set property ${target.constructor.name}.<${property.toString()}>. A prefab's properties cannot be set.`);
            }
        });
    }

    register(game: GameInstance): this {
        return new Proxy(<any>{
            [instanceId]: game.nextInstanceId(),
            // todo add support for json.stringify
        }, 
        {
            get: (target: this, property: PropertyKey) => {
                // if (property in target) {
                //     if (property === instanceId) {
                //         return target[instanceId];
                //     }
                // }
                return Reflect.get(Game.getPrefab(target[instanceId]), property); // todo
            },
            set: (target: this, property: PropertyKey, value: any) => {
                const pTarget = Game.getPrefab(target[instanceId]);
                game.output.push(`Set <${property.toString()}> from <${pTarget[property]}> to <${value}>`); // todo
                return true;
            }
        });
    }
}

const game = new GameInstance();
const lars_fab = new Agent("lars").prefab();
console.log(JSON.stringify(lars_fab, null, 2));

const lars = lars_fab.register(game);
lars.name = "jimmy";

console.log(JSON.stringify(lars_fab, null, 2));
console.log(`Lars name: ${lars.name}`); // expected to be lars right now
console.log(JSON.stringify(game, null, 2));