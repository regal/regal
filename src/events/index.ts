/**
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
export { enqueue, nq, on } from "./func/event-builders";
export {
    EventRecord,
    DEFAULT_EVENT_ID,
    DEFAULT_EVENT_NAME
} from "./event-record";
export { InstanceEvents } from "./instance-events";
export { recycleInstanceEvents } from "./func/recycle-instance-events";
export { buildInstanceEvents } from "./impl";
