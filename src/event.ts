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
    thenq(...events: TrackedEvent[]): EventQueue;
}

// export enum QueueInsertionType {
//     IMMEDIATE,
//     DELAYED
// }

export interface EventQueue extends TrackedEvent {
    // qType: QueueInsertionType;
    // events: TrackedEvent[];
    immediateEvents: TrackedEvent[];
    delayedEvents: TrackedEvent[];
    enqueue(...events: TrackedEvent[]): EventQueue;
    nq(...events: TrackedEvent[]): EventQueue;
}

export const isTrackedEvent = (o: any): o is TrackedEvent => 
    (<TrackedEvent>o).target !== undefined;

export const isEventQueue = (o: any): o is EventQueue =>
    (<EventQueue>o).nq !== undefined;
    // (<EventQueue>o).qType !== undefined;

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

    // _addEvents(events: TrackedEvent[], insertionType: QueueInsertionType, cause?: EventRecord): void {
    //     const records = events.map(event =>
    //         new EventRecord(++this._lastEventId, event.eventName, event)
    //     );

    //     if (cause) {
    //         cause.trackCausedEvent(...records);
    //     }
        
    //     switch (insertionType) {
    //         case QueueInsertionType.IMMEDIATE:
    //             this._queue = records.concat(this._queue);
    //             break;

    //         case QueueInsertionType.DELAYED:
    //             this._queue = this._queue.concat(records);
    //             break;

    //         default:
    //             throw new RegalError("Invalid QueueInsertionType");
    //     }
    // }

    _addEvent(event: TrackedEvent, cause?: EventRecord): void {
        let immediateEvents: TrackedEvent[];
        let delayedEvents: TrackedEvent[];

        if (isEventQueue(event)) {
            immediateEvents = event.immediateEvents;
            delayedEvents = event.delayedEvents;
        } else {
            immediateEvents = [event];
            delayedEvents = [];
        }

        const mapToRecord = (event: TrackedEvent) =>
            new EventRecord(++this._lastEventId, event.eventName, event);

        const immediateEventRecords = immediateEvents.map(mapToRecord);
        const delayedEventRecords = delayedEvents.map(mapToRecord);

        if (cause) {
            cause.trackCausedEvent(...immediateEventRecords);
            cause.trackCausedEvent(...delayedEventRecords);
        }

        this._queue = immediateEventRecords.concat(this._queue);
        this._queue = this._queue.concat(delayedEventRecords);
    }

    // _executeCurrent(): void {
    //     const current = this.current;
    //     const nextEvent = current.func.target(this.game);
    //     this._archiveCurrent();

    //     if (isTrackedEvent(nextEvent) && nextEvent !== noop) {
    //         if (isEventQueue(nextEvent))
    //             this._addEvents(nextEvent.events, nextEvent.qType, current);
    //         else
    //             this._addEvents([nextEvent], QueueInsertionType.IMMEDIATE, current);
    //     }

    //     if (this._queue.length > 0) {
    //         this._executeCurrent();
    //     }
    // }

    _executeCurrent(): void {
        const current = this.current;
        const nextEvent = current.func.target(this.game);
        this._archiveCurrent();

        if (isTrackedEvent(nextEvent) && nextEvent !== noop) {
            this._addEvent(nextEvent, current);
        }

        if (this._queue.length > 0) {
            this._executeCurrent();
        }
    }

    // invoke(event: TrackedEvent): void {
    //     this._addEvents([event], QueueInsertionType.IMMEDIATE);
    //     this._executeCurrent();
    // }

    invoke(event: TrackedEvent): void {
        this._addEvent(event);
        this._executeCurrent();
    }
}

const illegalEventQueueInvocation = () => (game: GameInstance): undefined => {
    throw new RegalError("Cannot invoke an EventQueue.");
};

// // Builds the `then` method on a given TrackedEvent
// const buildThenMethod = (cause: TrackedEvent) => 
//     (...events: TrackedEvent[]): EventQueue => {
//         const eq = <EventQueue>(illegalEventQueueInvocation);

//         eq.target = illegalEventQueueInvocation;
//         eq.eventName = "Q IMMEDIATE";
//         eq.qType = QueueInsertionType.IMMEDIATE;
//         eq.then = buildThenMethod(eq);

//         // If previous event is an event queue, include that queue.
//         eq.events = isEventQueue(cause) 
//             ? cause.events.concat(events) 
//             : Array.prototype.concat(cause, events);
        
//         return eq;
//     };

const buildEventQueue = (immediateEvents: TrackedEvent[], delayedEvents: TrackedEvent[]): EventQueue => {
    const eq = <EventQueue>(illegalEventQueueInvocation());
    eq.target = illegalEventQueueInvocation();
    eq.then = thenConstructor(eq);
    eq.thenq = (...events: TrackedEvent[]) => eq.then(enqueue(...events));

    eq.enqueue = (...events: TrackedEvent[]): EventQueue => {
        const resultQueue = enqueue(...events);
        return buildEventQueue(eq.immediateEvents, eq.delayedEvents.concat(resultQueue.delayedEvents));
    };
    eq.nq = eq.enqueue;

    eq.immediateEvents = immediateEvents;
    eq.delayedEvents = delayedEvents;

    return eq;
};

export const enqueue = (...events: TrackedEvent[]): EventQueue => {
    const argImmediateEvents: TrackedEvent[] = [];
    const argDelayedEvents: TrackedEvent[] = [];

    events.forEach(event => {
        if (isEventQueue(event)) {
            argImmediateEvents.push(...event.immediateEvents);
            argDelayedEvents.push(...event.delayedEvents);
        } else {
            argImmediateEvents.push(event);
        }
    });

    return buildEventQueue([], argImmediateEvents.concat(argDelayedEvents));
};

export const nq = enqueue;

const thenConstructor = (rootTarget: TrackedEvent) =>
    (...events: TrackedEvent[]): EventQueue => {
        const singleThen = (target: TrackedEvent, arg: TrackedEvent): EventQueue => {
            let targetImmediateEvents: TrackedEvent[];

            if (isEventQueue(target)) {
                if (target.delayedEvents.length > 0) {
                    throw new RegalError("Any enqueue instruction must happen at the end of the return statement.");
                }
                targetImmediateEvents = target.immediateEvents;
            } else {
                targetImmediateEvents = [target];
            }

            let argImmediateEvents: TrackedEvent[];
            let argDelayedEvents: TrackedEvent[];

            if (isEventQueue(arg)) {
                argImmediateEvents = arg.immediateEvents;
                argDelayedEvents = arg.delayedEvents;
            } else {
                argImmediateEvents = [arg];
                argDelayedEvents = [];
            }

            return buildEventQueue(targetImmediateEvents.concat(argImmediateEvents), argDelayedEvents);
        }

        return <EventQueue>events.reduce(singleThen, rootTarget);
    };

export const on = (eventName: string, eventFunc: EventFunction): TrackedEvent => {
    const event = <TrackedEvent>((game: GameInstance) => {
        game.events.invoke(event);
        return noop;
    });

    event.eventName = eventName;
    event.target = eventFunc;

    // event.then = buildThenMethod(event);
    event.then = thenConstructor(event);
    event.thenq = (...events: TrackedEvent[]) => event.then(enqueue(...events));

    return event;
};

// * TODO: Allow combinations of immediate and delayed events
// * {qType: QueueInsertionType; events: TrackedEvent[]}[]
// export const enqueue = (...events: TrackedEvent[]): EventQueue => {
//     const eq = <EventQueue>(illegalEventQueueInvocation);

//     eq.target = illegalEventQueueInvocation;
//     eq.eventName = "Q DELAYED";
//     eq.qType = QueueInsertionType.DELAYED;
//     eq.events = events;

//     eq.then = (o: any) => {
//         throw new RegalError("A delayed queue cannot have a `then`.");
//     }

//     return eq;
// };

// export const nq = enqueue;

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