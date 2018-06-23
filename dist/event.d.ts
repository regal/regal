import { GameInstance } from './gameInstance';
export declare type EventFunction = (x: GameInstance) => GameInstance;
export declare const on: (name: string, func: EventFunction) => EventFunction;
export declare const noop: () => (game: GameInstance) => GameInstance;
export declare const pipe: (...funcs: EventFunction[]) => EventFunction;
export declare const queue: (...funcs: EventFunction[]) => EventFunction;
