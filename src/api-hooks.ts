/**
 * Functions for hooking into the Regal Game Library's Game API.
 *
 * A hook is a function that is called internally by the Game API,
 * and can be implemented by the game developer. This allows the
 * developer to modify the behavior of the API.
 *
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
 */

import { RegalError } from "./error";
import { EventFunction, isTrackedEvent, on, TrackedEvent } from "./event";
import GameInstance from "./game-instance";

/** Default implementation of `beforeUndoCommandHook`; always returns true. */
const returnTrue = (game: GameInstance) => true;

/**
 * Manager for the Game's API hooks.
 */
export class HookManager {
    /** `TrackedEvent` to be executed whenver `Game.postPlayerCommand` is called. */
    public static playerCommandHook: (command: string) => TrackedEvent;

    /** `TrackedEvent` to be executed whenever `Game.postStartCommand` is called. */
    public static startCommandHook: TrackedEvent;

    /**
     * Executes whenever `Game.postUndoCommand` is called, before the undo operation is executed.
     * Defaults to always return true.
     * @returns Whether the undo operation is allowed.
     */
    public static beforeUndoCommandHook: (
        game: GameInstance
    ) => boolean = returnTrue;

    /**
     * Resets the API hooks to their default values.
     */
    public static resetHooks() {
        this.playerCommandHook = undefined;
        this.startCommandHook = undefined;
        this.beforeUndoCommandHook = returnTrue;
    }
}

/**
 * Sets the function to be executed whenever a player command is sent to the Game API
 * via `Game.postPlayerCommand`.
 * @param handler A function that takes a string containing the player's command and
 * generates an `EventFunction`. May be an `EventFunction`, `TrackedEvent`, or `EventQueue`.
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
 * Sets the function to be executed whenever a start command is sent to the Game API
 * via `Game.postStartCommand`.
 * @param handler The `EventFunction` to be executed. May be an `EventFunction`, `TrackedEvent`, or `EventQueue`.
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
 * Sets the function to be executed whenever `Game.postUndoCommand` is called,
 * before the undo operation is executed.
 *
 * If this function is never called, all valid undo operations will be allowed.
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
