"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a, _b;
const game_1 = require("./game");
const uidGenerator = {
    _uid: 0,
    next: function () {
        this._uid += 1;
        return this._uid;
    }
};
exports.isPrefab = Symbol("isPrefab");
exports.instanceId = Symbol("instanceId");
exports.prefabId = Symbol("prefabId");
class Agent {
    constructor() {
        this[_a] = -1;
        this[_b] = -1;
        return new Proxy(this, {
            // Prevent read access to @@prefabId and @@instanceId
            get: (target, property) => {
                if (property in target) {
                    if (property === exports.prefabId && !target[exports.isPrefab]) {
                        throw new game_1.RegalError(game_1.ErrorCode.INVALID_STATE, `${target.constructor.name} has no prefabId, as it is not associated with a prefab.`);
                    }
                    else if (property === exports.instanceId && target[exports.instanceId] <= 0) {
                        throw new game_1.RegalError(game_1.ErrorCode.INVALID_STATE, `${target.constructor.name} has no instanceId.`);
                    }
                }
                return Reflect.get(target, property);
            }
        });
    }
    get [(_a = exports.prefabId, _b = exports.instanceId, exports.isPrefab)]() {
        return this[exports.prefabId] > 0;
    }
    prefab() {
        if (this[exports.isPrefab]) {
            throw new game_1.RegalError(game_1.ErrorCode.INVALID_STATE, "Agent is already a prefab.");
        }
        this[exports.prefabId] = game_1.Game.addPrefab(this);
        return new Proxy(this, {
            // Disable prefab properties from being modified.
            set: (target, property, value) => {
                throw new game_1.RegalError(game_1.ErrorCode.INVALID_STATE, `Could not set property ${target.constructor.name}.<${property.toString()}>. A prefab's properties cannot be set.`);
            }
        });
    }
    register(game) {
        const insId = game.nextInstanceId();
        const instance = new Proxy({
            [exports.prefabId]: this[exports.prefabId],
            [exports.instanceId]: insId,
        }, {
            get: (instance, property) => {
                const prefab = game_1.Game.getPrefab(Reflect.get(instance, exports.prefabId));
                // If a modified property exists in the instance, return it.
                if (property in instance) {
                    return Reflect.get(instance, property);
                }
                // Otherwise, retrieve the property from the prefab.
                else {
                    return Reflect.get(prefab, property);
                }
            },
            set: (instance, property, value) => {
                const insId = instance[exports.instanceId];
                const prefab = game_1.Game.getPrefab(instance[exports.prefabId]);
                if (property in prefab) {
                    const prefabValue = prefab[property];
                    // If a modified property already exists in the instance:
                    if (property in instance) {
                        const instanceValue = Reflect.get(instance, property);
                        // If the property's new value is equal to the instance's current value, do nothing.
                        if (instanceValue === value) { }
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
                        if (prefabValue === value) { }
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
        game.agents.set(insId, instance);
        return instance;
    }
}
exports.Agent = Agent;
const game = new game_1.GameInstance();
