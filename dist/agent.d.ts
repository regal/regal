import { GameInstance } from "./game";
export declare const isPrefab: unique symbol;
export declare const instanceId: unique symbol;
export declare const prefabId: unique symbol;
export declare class Agent {
    [prefabId]: number;
    [instanceId]: number;
    constructor();
    readonly [isPrefab]: boolean;
    prefab(): this;
    register(game: GameInstance): this;
}
