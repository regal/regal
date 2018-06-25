"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.on = (name, func) => (game) => {
    game.events.push(name);
    return func(game);
};
exports.noop = () => (game) => game;
exports.pipe = (...funcs) => (!funcs || funcs.length === 0) ? exports.noop() : funcs.reduce((f, g) => (game) => g(f(game)));
exports.queue = (...funcs) => {
    if (!funcs || funcs.length === 0) {
        return exports.noop();
    }
    else {
        return (game) => {
            game.queue.push(...funcs);
            return game;
        };
    }
};
exports.runQueue = (game) => {
    if (game) {
        const queue = game.queue;
        while (queue.length > 0) {
            const event = queue.shift();
            if (event) {
                game = event(game);
            }
        }
    }
    return game;
};
