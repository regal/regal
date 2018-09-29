/**
 * Public exports from the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { Agent, InstanceAgents } from "./agents";
export {
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "./api-hooks";
export { RegalError } from "./error";
export {
    EventFunction,
    TrackedEvent,
    EventQueue,
    noop,
    EventRecord,
    InstanceEvents,
    enqueue,
    nq,
    on
} from "./events";
export { Game, GameResponse } from "./game-api";
export { GameOptions, GameMetadata } from "./config";
export { default as GameInstance } from "./game-instance";
export {
    OutputLineType,
    OutputLine,
    InstanceOutput,
    GameOutput
} from "./output";
