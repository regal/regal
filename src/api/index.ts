/**
 * Component for interfacing with the game via the Game API.
 * A game that consumes the Regal Game Library becomes exposed via this API.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { GameResponse, GameResponseOutput } from "./game-response";
export { Game } from "./game-api";
export {
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "./func/api-hooks";
export { HookManager } from "./api-hook-manager";
