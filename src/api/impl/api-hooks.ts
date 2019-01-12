/*
 * Functions for hooking into the Regal Game Library's Game API.
 *
 * A hook is a function that is called internally by the Game API
 * and can be implemented by the game developer. This allows the
 * developer to modify the behavior of the API.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../../error";
import { EventFunction, isTrackedEvent, on } from "../../events";
import { GameInstance } from "../../state";
import { HookManager, returnTrue } from "../api-hook-manager";

/**
 * `GameApi` hook that sets the function to be executed whenever a player command
 * is sent to the Game API via `GameApi.postPlayerCommand`.
 *
 * May only be set once.
 *
 * @param handler A function that takes a string containing the player's command and
 * returns an `EventFunction`. May be an `EventFunction`, `TrackedEvent`, or `EventQueue`.
 */
export const onPlayerCommand = (
    handler: (command: string) => EventFunction
): void => {
    if (HookManager.playerCommandHook !== undefined) {
        throw new RegalError("Cannot call onPlayerCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    // Generate a TrackedEvent called INPUT
    const trackedEvent = (cmd: string) =>
        on("INPUT", game => {
            const activatedHandler = handler(cmd);

            // Allow the handler to be an EventFunction, a TrackedEvent, or an EventQueue
            if (isTrackedEvent(activatedHandler)) {
                return activatedHandler;
            } else {
                return activatedHandler(game);
            }
        });

    HookManager.playerCommandHook = trackedEvent;
};

/**
 * `GameApi` hook that sets the function to be executed whenever a start command
 * is sent to the Game API via `GameApi.postStartCommand`.
 *
 * May only be set once.
 *
 * @param handler The `EventFunction` to be executed. May be an `EventFunction`,
 * `TrackedEvent`, or `EventQueue`.
 */
export const onStartCommand = (handler: EventFunction): void => {
    if (HookManager.startCommandHook !== undefined) {
        throw new RegalError("Cannot call onStartCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    // Generate a TrackedEvent called START
    const trackedEvent = on("START", game => {
        // Allow the handler to be an EventFunction, a TrackedEvent, or an EventQueue
        if (isTrackedEvent(handler)) {
            return handler;
        } else {
            return handler(game);
        }
    });

    HookManager.startCommandHook = trackedEvent;
};

/**
 * `GameApi` hook that sets the function to be executed whenever
 * `GameApi.postUndoCommand` is called, before the undo operation is executed.
 *
 * If the handler function returns `true`, the undo will be allowed. If it returns `false`,
 * the undo will not be allowed. If the hook is never set, all valid undo operations
 * will be allowed.
 *
 * May only be set once.
 *
 * @param handler Returns whether the undo operation is allowed, given the current `GameInstance`.
 */
export const onBeforeUndoCommand = (
    handler: (game: GameInstance) => boolean
): void => {
    if (HookManager.beforeUndoCommandHook !== returnTrue) {
        throw new RegalError("Cannot call onBeforeUndoCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    HookManager.beforeUndoCommandHook = handler;
};
