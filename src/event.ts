import { GameInstance } from './game';

export type EventFunction = (x: GameInstance) => GameInstance;

export interface Event {
    id: number
    name: string
}

const DEFAULT_EVENT_NAME: string = "DEFAULT";
const DEFAULT_EVENT_ID: number = 0;

export class InstanceEvents {

    list: Event[] = [];

    getCurrentEvent(): Event {
        let event = this.list[this.list.length - 1];

        if (!event) {
            event = {
                id: DEFAULT_EVENT_ID,
                name: DEFAULT_EVENT_NAME
            }
        }

        return event;
    }

    push(name: string): void {
        const lastId = (this.list.length > 0) ? this.list[this.list.length - 1].id : DEFAULT_EVENT_ID;
        this.list.push({
            id: lastId + 1,
            name
        });
    }

}

export const on = (name: string, func: EventFunction): EventFunction => 
    (game: GameInstance) => {
        game.events.push(name);
        return func(game);
};

export const noop = () => (game: GameInstance) => game;

export const pipe = (...funcs: EventFunction[]): EventFunction =>
    (!funcs || funcs.length === 0) ? noop() : funcs.reduce((f, g) => (game: GameInstance) => g(f(game)));

export const queue = (...funcs: EventFunction[]): EventFunction => {
    if (!funcs || funcs.length === 0) {
        return noop();
    } else {
        return (game: GameInstance) => {
            game.queue.push(...funcs);
            return game;
        };
    }
};

export const runQueue = (game: GameInstance): GameInstance => {
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
}