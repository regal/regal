import { RegalError, ErrorCode, GameInstance } from "./game";

const uidGenerator = {
    _uid: 0,
    next: function() {
        this._uid += 1;
        return this._uid;
    }
}

export const prefabbed = Symbol("prefabbed");
export const uid = Symbol("uid");
export const agent = Symbol("agent");

export class Agent {
    [prefabbed]: boolean = false;
    [uid]: number = -1;

    constructor(public name: string) {
        return new Proxy(this, {
            get: (target: this, property: PropertyKey) => {
                if (property in target) {
                    if (property === uid && !target[prefabbed]) {
                        throw new RegalError(ErrorCode.INVALID_STATE, `uid only exists on prefabbed Agents.`);
                    }
                }
                return Reflect.get(target, property);
            }
        })
    }

    prefab(): this {
        if (this[prefabbed]) {
            throw new RegalError(ErrorCode.INVALID_STATE, "Agent is already a prefab.");
        }

        this[prefabbed] = true;
        this[uid] = uidGenerator.next();

        return new Proxy(this, {
            get: (target: this, property: PropertyKey) => {
                return Reflect.get(target, property);
            },

            set: (target: this, property: PropertyKey, value: any) => {
                throw new RegalError(ErrorCode.INVALID_STATE, `Could not set property <${target.constructor.name}>.<${property.toString()}>. A prefab's properties cannot be set.`);
            }
        });
    }

    register(game: GameInstance): this {
        return new Proxy(<any>{
            [agent]: this
            // todo add support for json.stringify
        }, 
        {
            get: (target: this, property: PropertyKey) => {
                return Reflect.get(target[agent], property); // todo
            },
            set: (target: this, property: PropertyKey, value: any) => {
                const pTarget = <this>target[agent];
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