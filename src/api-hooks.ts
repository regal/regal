import { EventFunction, TrackedEvent, on } from "./event";
import GameInstance from "./game-instance";
import { RegalError } from "./error";

const returnTrue = (game: GameInstance) => true;

export class HookManager {

    static playerCommandHook: (command: string) => TrackedEvent;
    static startCommandHook: TrackedEvent;
    static beforeUndoCommandHook: (game: GameInstance) => boolean = returnTrue;

    static resetHooks() {
        this.playerCommandHook = undefined;
        this.startCommandHook = undefined;
        this.beforeUndoCommandHook = returnTrue;
    }
}

export const onPlayerCommand = (handler: (command: string) => EventFunction): void => {
    if (HookManager.playerCommandHook !== undefined) {
        throw new RegalError("Cannot call onPlayerCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    const trackedEvent = (cmd: string) => on("INPUT", handler(cmd));

    HookManager.playerCommandHook = trackedEvent;
};

export const onStartCommand = (handler: EventFunction): void => {
    if (HookManager.startCommandHook !== undefined) {
        throw new RegalError("Cannot call onStartCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    const trackedEvent = on("START", handler);

    HookManager.startCommandHook = trackedEvent;
};

export const onBeforeUndoCommand = (handler: (game: GameInstance) => boolean): void => {
    if (HookManager.beforeUndoCommandHook !== returnTrue) {
        throw new RegalError("Cannot call onBeforeUndoCommand more than once.");
    }
    if (handler === undefined) {
        throw new RegalError("Handler must be defined.");
    }

    HookManager.beforeUndoCommandHook = handler;
};