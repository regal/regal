/*
 * The purpose of this file is to abstract all api-related implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */
export {
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand
} from "./api-hooks";
export { Game } from "./game-impl";
