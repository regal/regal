import { GameInstance } from './game';
export declare type EventFunction = (x: GameInstance) => GameInstance;
export interface Event {
    id: number;
    name: string;
}
export declare class InstanceEvents {
    list: Event[];
    getCurrentEvent(): Event;
    push(name: string): void;
}
export declare const on: (name: string, func: EventFunction) => EventFunction;
export declare const noop: () => (game: GameInstance) => GameInstance;
export declare const pipe: (...funcs: EventFunction[]) => EventFunction;
export declare const queue: (...funcs: EventFunction[]) => EventFunction;
export declare const runQueue: (game: GameInstance) => GameInstance;
