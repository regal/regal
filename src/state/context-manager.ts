/**
 * Contains the static class that manages the game's context.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

// tslint:disable-next-line
true; // This does nothing; it's only so the jsdocs won't conflict

/**
 * Manages the game's context by keeping track of whether the
 * context is currently static or not.
 *
 * A game's context is static during the declaration period,
 * meaning when the source is run initially and static managers
 * (like the `StaticAgentRegistry`) are populated.
 *
 * A game's context is non-static as soon as it is initialized
 * by some command in the `Game` API. Every `GameInstance` exists
 * in a non-static context.
 */
export class ContextManager {
    /** Whether the game's context is currently static. */
    public static isContextStatic(): boolean {
        return this._contextIsStatic;
    }

    /** Resets the game's context to be static. */
    public static reset(): void {
        this._contextIsStatic = true;
    }

    /** Sets the game's context to be non-static. */
    public static init(): void {
        this._contextIsStatic = false;
    }

    /** Internal variable to track whether the context is static. */
    private static _contextIsStatic: boolean = true;
}
