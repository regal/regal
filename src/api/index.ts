/*
 * Component for interfacing with the game via the Game API.
 * A game that consumes the Regal Game Library becomes exposed via this API.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { GameResponse, GameResponseOutput } from "./game-response";
export {
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand,
    Game
} from "./impl";
export { HookManager } from "./api-hook-manager";
export { GameApi } from "./game-api";
export { GameApiExtended } from "./game-api-extended";
