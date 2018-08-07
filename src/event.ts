import { GameInstance, RegalError } from './game';
import { PropertyChange } from './agent';

export const DEFAULT_EVENT_ID: number = 0;
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

export type EventFunction = (game: GameInstance) => EventFunction;

export const noop: EventFunction = game => undefined;

export class EventRecord {

    output?: string[]
    causedBy?: number
    caused?: number[]
    changes?: PropertyChange[]

    constructor(public id: number = DEFAULT_EVENT_ID, 
        public name: string = DEFAULT_EVENT_NAME) {}

    trackOutputWrite(...lines: string[]): void {
        if (this.output === undefined) {
            this.output = [];
        }
        this.output.push(...lines);
    }

    trackCausedEvent(...events: EventRecord[]): void {
        if (this.caused === undefined) {
            this.caused = [];
        }
        this.caused.push(...events.map(e => e.id));
    }
}

export class InstanceEvents {

    history: EventRecord[] = [];

    private _lastEventId = DEFAULT_EVENT_ID;
    private _eventStack: EventRecord[] = [
        new EventRecord()
    ];

    startEvent(eventName: string): EventRecord {
        const id = ++this._lastEventId;
        const record = new EventRecord(id, eventName);

        this._eventStack.push(record);

        return record;
    }

    stopEvent(): void {
        if (this.current.id === DEFAULT_EVENT_ID) {
            throw new RegalError("Cannot stop the default event.");
        }

        this.history.unshift(this._eventStack.pop());
    }

    get current(): EventRecord {
        return this._eventStack[this._eventStack.length - 1];
    }
}

export const on = (eventName: string, eventFunc: EventFunction): EventFunction =>
    (game: GameInstance) => {
        const event = game.events.startEvent(eventName);
        const result = eventFunc(game);
        
        result(game);
        game.events.stopEvent();

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