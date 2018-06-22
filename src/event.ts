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
};

export const tryCast = function<T>(obj: any, typeName: string) {
    if (typeof obj === typeName) {
        return obj;
    } else {
        return undefined;
    }
};

export const pipe = (...funcs: EventFunction[]): EventFunction => funcs.reduce((f, g) => (game: GameInstance) => g(f(game))); //todo

export const queue = (...funcs: EventFunction[]) => {
    if (!funcs || funcs.length == 0) {
        return noop();
    } else {
        return pipe(...funcs); //todo
    }
};

/*
// return ifType(subject, "ICanHold", (sub: ICanHold) => queue(sub.items.map(item => drop(sub, item))), noop) (game);
ifType(subject, "ICanHold", (s: ICanHold) => {}).elseIf("")

*/