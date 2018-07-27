"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_EVENT_NAME = "DEFAULT";
const DEFAULT_EVENT_ID = 0;
class InstanceEvents {
    constructor() {
        this.list = [];
    }
    getCurrentEvent() {
        let event = this.list[this.list.length - 1];
        if (!event) {
            event = {
                id: DEFAULT_EVENT_ID,
                name: DEFAULT_EVENT_NAME
            };
        }
        return event;
    }
    push(name) {
        const lastId = (this.list.length > 0) ? this.list[this.list.length - 1].id : DEFAULT_EVENT_ID;
        this.list.push({
            id: lastId + 1,
            name
        });
    }
}
exports.InstanceEvents = InstanceEvents;
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
//# sourceMappingURL=event.js.map