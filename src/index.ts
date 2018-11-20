/*
 * Public exports from the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    Agent,
    InstanceAgentsInternal,
    PropertyChange,
    PropertyOperation
} from "./agents";
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
export {
    Game,
    GameResponse,
    GameResponseOutput,
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "./api";
export { GameOptions, GameMetadata } from "./config";
export { GameInstance } from "./state";
export { OutputLineType, OutputLine, InstanceOutput } from "./output";
