import { EventFunction } from "./event";
import GameInstance from "./game-instance";

export const HookManager = {
    // TODO
};

export const onPlayerCommand = (handler: (command: string) => EventFunction): void => {
    // TODO
    throw new Error("Method not implemented.");
};

export const onStartCommand = (handler: EventFunction): void => {
    // TODO
    throw new Error("Method not implemented.");
};

export const onBeforeUndoCommand = (handler: (game: GameInstance) => boolean): void => {
    // TODO
    throw new Error("Method not implemented.");
};