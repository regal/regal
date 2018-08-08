import { GameInstance, RegalError } from './game';
import { PropertyChange } from './agent';

export const DEFAULT_EVENT_ID: number = 0;
export const DEFAULT_EVENT_NAME: string = "DEFAULT";

export interface EventFunction { 
    (game: GameInstance): EventFunction;
}

export interface TrackedEvent extends EventFunction {
    (game: GameInstance): TrackedEvent | EventFunction;
    eventName: string;
    target: EventFunction;
    then(...events: TrackedEvent[]): EventQueue;
}

export enum QueueInsertionType {
    IMMEDIATE,
    DELAYED
}

export interface EventQueue extends TrackedEvent {
    qType: QueueInsertionType;
    events: TrackedEvent[];
}

export const isTrackedEvent = (o: any): o is TrackedEvent => 
    (<TrackedEvent>o).target !== undefined;

export const isEventQueue = (o: any): o is EventQueue =>
    (<EventQueue>o).qType !== undefined;

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

    _archiveCurrent(): void {
        delete this.current.func;
        this.history.unshift(this._queue.shift());
    }

    _addEvents(events: TrackedEvent[], insertionType: QueueInsertionType, cause?: EventRecord): void {
        const records = events.map(event =>
            new EventRecord(++this._lastEventId, event.eventName, event)
        );

        if (cause) {
            cause.trackCausedEvent(...records);
        }
        
        switch (insertionType) {
            case QueueInsertionType.IMMEDIATE:
                this._queue = records.concat(this._queue);
                break;

            case QueueInsertionType.DELAYED:
                this._queue = this._queue.concat(records);
                break;

            default:
                throw new RegalError("Invalid QueueInsertionType");
        }
    }

    _executeCurrent(): void {
        const current = this.current;
        const nextEvent = current.func.target(this.game);
        this._archiveCurrent();

        if (isTrackedEvent(nextEvent) && nextEvent !== noop) {
            if (isEventQueue(nextEvent))
                this._addEvents(nextEvent.events, nextEvent.qType, current);
            else
                this._addEvents([nextEvent], QueueInsertionType.IMMEDIATE, current);
        }

        if (this._queue.length > 0) {
            this._executeCurrent();
        }
    }

    invoke(event: TrackedEvent): void {
        this._addEvents([event], QueueInsertionType.IMMEDIATE);
        this._executeCurrent();
    }
}

const illegalEventQueueInvocation = (game: GameInstance): undefined => {
    throw new RegalError("Cannot invoke an EventQueue.");
}

export const on = (eventName: string, eventFunc: EventFunction): TrackedEvent => {
    const event = <TrackedEvent>((game: GameInstance) => {
        game.events.invoke(event);
        return noop;
    });

    event.eventName = eventName;
    event.target = eventFunc;

    event.then = (...events: TrackedEvent[]): EventQueue => {
        const eq = <EventQueue>(illegalEventQueueInvocation);

        eq.target = illegalEventQueueInvocation;
        eq.eventName = "Q IMMEDIATE";
        eq.qType = QueueInsertionType.IMMEDIATE;

        // If previous event is an event queue, include that queue.
        eq.events = isEventQueue(event) 
            ? event.events.concat(events) 
            : Array.prototype.concat(event, events);
        
        return eq;
    };

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