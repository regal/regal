/*
 * Component for creating and handling game events in the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    EventFunction,
    EventQueue,
    noop,
    TrackedEvent,
    GameEventBuilder,
    isEventQueue,
    isTrackedEvent
} from "./event-types";
export { EventRecord, EventId } from "./event-record";
export { InstanceEvents } from "./instance-events";
export { InstanceEventsInternal } from "./instance-events-internal";
export {
    buildInstanceEvents,
    enqueue,
    nq,
    on,
    getUntrackedEventPK,
    DEFAULT_EVENT_NAME
} from "./impl";
