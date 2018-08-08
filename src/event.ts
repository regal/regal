import { GameInstance, RegalError } from './game';
import { PropertyChange } from './agent';

export const DEFAULT_EVENT_ID: number = 0;
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

export type EventFunction = (game: GameInstance) => EventFunction;

export interface TrackedEvent extends EventFunction {
    (game: GameInstance): TrackedEvent | EventFunction;
    eventName: string;
    target: EventFunction
}

function isTrackedEvent(o: any): o is TrackedEvent {
    return (<TrackedEvent>o).target !== undefined;
}

export const noop: TrackedEvent = (() => {
    const nonEvent = (game: GameInstance) => undefined;

    const event = <TrackedEvent>(nonEvent);

    event.eventName = "noop";
    event.target = nonEvent;

    return event;
})();

export class EventRecord {

    output?: string[];
    causedBy?: number;
    caused?: number[];
    changes?: PropertyChange[];

    static default = new EventRecord();

    constructor(
        public id: number = DEFAULT_EVENT_ID, 
        public name: string = DEFAULT_EVENT_NAME, 
        public func: TrackedEvent = noop
    ) {}

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
        events.forEach(e => e.causedBy = this.id);
    }
}

export class InstanceEvents {

    history: EventRecord[] = [];

    private _lastEventId = DEFAULT_EVENT_ID;
    private _queue: EventRecord[] = [];

    constructor(public game: GameInstance) {}

    get current(): EventRecord {
        let event = this._queue[0];

        if (event === undefined) {
            event = EventRecord.default;
        }

        return event;
    }

    archiveCurrent(): void {
        delete this.current.func;
        this.history.unshift(this._queue.shift());
    }

    addEvent(event: TrackedEvent): EventRecord {
        const id = ++this._lastEventId;
        const record = new EventRecord(id, event.eventName, event);

        this._queue.push(record);

        return record;
    }

    executeCurrent(): void {
        const current = this.current;
        const nextEvent = current.func.target(this.game);
        this.archiveCurrent();

        if (isTrackedEvent(nextEvent) && nextEvent !== noop) {
            const nextEventRecord = this.addEvent(nextEvent);
            current.trackCausedEvent(nextEventRecord);
            this.executeCurrent();
        }
    }
}

export const on = (eventName: string, eventFunc: EventFunction): TrackedEvent => {
    const event = <TrackedEvent>((game: GameInstance) => {
        game.events.addEvent(event);
        game.events.executeCurrent();

        return noop;
    });

    event.eventName = eventName;
    event.target = eventFunc;

    return event;
}
    


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