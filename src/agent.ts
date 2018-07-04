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
            // Prevent read access to @@prefabId and @@instanceId
            get: (target: this, property: PropertyKey) => {
                if (property in target) {
                    if (property === prefabId && !target[isPrefab]) {
                        throw new RegalError(ErrorCode.INVALID_STATE, `${target.constructor.name} has no prefabId, as it is not associated with a prefab.`);
                    } 
                    else if (property === instanceId && target[instanceId] <= 0) {
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
            // Disable prefab properties from being modified.
            set: (target: this, property: PropertyKey, value: any) => {
                throw new RegalError(ErrorCode.INVALID_STATE, `Could not set property ${target.constructor.name}.<${property.toString()}>. A prefab's properties cannot be set.`);
            }
        });
    }

    register(game: GameInstance): this {
        const insId = game.nextInstanceId();

        const instance = new Proxy(<any>{
            [prefabId]: this[prefabId],
            [instanceId]: insId,
        }, 
        {
            // TODO: add support for json.stringify

            get: (instance: this, property: PropertyKey) => {
                const prefab = Game.getPrefab(Reflect.get(instance, prefabId));

                // JSON workaround
                if (property.toString() === "toJSON") { 
                    const result = {};
                    for (let key in prefab) {
                        result[key] = (key in instance) ? instance[key] : prefab[key];
                    }
                    result["prefabId"] = instance[prefabId];
                    result["instanceId"] = instance[instanceId];
                    return () => result;
                }

                // If a modified property exists in the instance, return it.
                else if (property in instance) {
                    return Reflect.get(instance, property);
                } 
                
                // Otherwise, retrieve the property from the prefab.
                else {
                    console.log(property.toString());
                    return Reflect.get(prefab, property);
                }
            },

            set: (instance: this, property: PropertyKey, value: any) => {
                const insId = instance[instanceId];
                const prefab = Game.getPrefab(instance[prefabId]);

                if (property in prefab) {
                    const prefabValue = prefab[property];

                    // If a modified property already exists in the instance:
                    if (property in instance) {
                        const instanceValue = Reflect.get(instance, property);

                        // If the property's new value is equal to the instance's current value, do nothing.
                        if (instanceValue === value) {}
    
                        // If the property's new value is equal to the prefab's value, delete the instance property.
                        else if (prefabValue === value) {
                            Reflect.deleteProperty(instance, property);
                        }

                        // If the property's new value is different, update the instance.
                        else {
                            Reflect.set(instance, property, value);
                        }
                    } 

                    // Otherwise, the property does not yet exist in the instance:
                    else {

                        // If the property's new value is equal to prefab's current value, do nothing.
                        if (prefabValue === value) {}

                        // If the property's new value is different, update the instance.
                        else {
                            Reflect.set(instance, property, value);
                        }
                    }

                    return true;
                } 

                return Reflect.set(instance, property, value);
            }
        });

        game.state.set(insId, instance);
        return instance;
    }
}

const game = new GameInstance();
const lars_fab = new Agent("lars").prefab();
const lars_ins = lars_fab.register(game);
lars_ins.name = "jim";
const lars_ins2 = lars_fab.register(game);
lars_ins2.name = "blorp";
console.log(JSON.stringify(lars_fab, null, 2));
console.log(JSON.stringify(lars_ins, null, 2));
console.log(JSON.stringify(lars_ins2, null, 2));
