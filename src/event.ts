import {GameInstance} from './gameInstance';

export type EventFunction = (x: GameInstance) => GameInstance;

export const on = (name: string, func: EventFunction): EventFunction => 
    (game: GameInstance) => {
        game.events.push(name);
        return func(game);
};

export const noop = () => (game: GameInstance) => game;

export const pipe = (...funcs: EventFunction[]): EventFunction =>
    (!funcs || funcs.length === 0) ? noop() : funcs.reduce((f, g) => (game: GameInstance) => g(f(game)));

export const queue = (...funcs: EventFunction[]) => {
    if (!funcs || funcs.length === 0) {
        return noop();
    } else {
        return pipe(...funcs); //todo
    }
};