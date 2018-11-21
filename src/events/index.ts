/*
 * Component for creating and handling game events in the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    EventFunction,
    EventQueue,
    noop,
    TrackedEvent,
    isEventQueue,
    isTrackedEvent
} from "./event-types";
export {
    EventRecord,
    DEFAULT_EVENT_ID,
    DEFAULT_EVENT_NAME
} from "./event-record";
export { InstanceEvents } from "./instance-events";
export { InstanceEventsInternal } from "./instance-events-internal";
export { buildInstanceEvents, enqueue, nq, on } from "./impl";
