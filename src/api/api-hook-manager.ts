import { TrackedEvent } from "../events";
import GameInstance from "../game-instance";
import { returnTrue } from "./func/api-hooks";

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
    public static reset() {
        this.playerCommandHook = undefined;
        this.startCommandHook = undefined;
        this.beforeUndoCommandHook = returnTrue;
    }
}
