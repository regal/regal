import { GameInstance, RegalError } from './game';
import { PropertyChange } from './agent';

export const DEFAULT_EVENT_NAME: string = "DEFAULT";
export const DEFAULT_EVENT_ID: number = 0;

export type EventFunction = (game: GameInstance) => EventFunction;

export const noop: EventFunction = game => undefined;

export interface EventRecord {
    id: number
    name: string
    output?: string[]
    causedBy?: number
    caused?: number[],
    changes?: PropertyChange[]
}

export class InstanceEvents {

    history: EventRecord[] = [];

    private _lastEventId = DEFAULT_EVENT_ID;
    private _eventStack: EventRecord[] = [
        {
            id: DEFAULT_EVENT_ID,
            name: DEFAULT_EVENT_NAME
        }
    ];

    startEvent(eventName: string): number {
        const id = ++this._lastEventId;

        this._eventStack.push({
            id,
            name: eventName
        });

        return id;
    }

    stopEvent(): void {
        if (this.currentEvent.id === DEFAULT_EVENT_ID) {
            throw new RegalError("Cannot stop the default event.");
        }

        this.history.unshift(this._eventStack.pop());
    }

    get currentEvent(): EventRecord {
        return this._eventStack[this._eventStack.length - 1];
    }
}

export const on = (eventName: string, eventFunc: EventFunction): EventFunction =>
    (game: GameInstance) => {
        game.events.startEvent(eventName);
        const result = eventFunc(game);
        game.events.stopEvent();

        result(game);
        
        return noop;
    };

// export const pipe = (...funcs: EventFunction[]): EventFunction =>
//     (!funcs || funcs.length === 0) ? noop() : funcs.reduce((f, g) => (game: GameInstance) => g(f(game)));

// export const queue = (...funcs: EventFunction[]): EventFunction => {
//     if (!funcs || funcs.length === 0) {
//         return noop();
//     } else {
//         return (game: GameInstance) => {
//             game.queue.push(...funcs);
//             return game;
//         };
//     }
// };

// export const runQueue = (game: GameInstance): GameInstance => {
//     if (game) {
//         const queue = game.queue;
//         while (queue.length > 0) {
//             const event = queue.shift();
//             if (event) {
//                 game = event(game);
//             }
//         }
//     }
//     return game;
// }