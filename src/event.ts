import {GameInstance} from './gameInstance';

export type EventFunction = (x: GameInstance) => GameInstance;

export const on = (name: string, func: EventFunction): EventFunction => 
    (game: GameInstance) => {
        game.events.push(name);
        return func(game);
};

export const noop = () => (game: GameInstance) => game;

export const ifType = function<T, U>(obj: any, typeName: string, acceptFunc: (x: T) => U, defaultFunc: (x: any) => U) {
    if (typeof obj === typeName) {
        return acceptFunc(<T>obj);
    } else {
        return defaultFunc(obj);
    }
}