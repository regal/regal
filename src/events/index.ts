/**
 * Component for creating and handling events in the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export {
    enqueue,
    EventFunction,
    EventQueue,
    noop,
    nq,
    on,
    TrackedEvent,
    isEventQueue,
    isTrackedEvent
} from "./event-model";
export { EventRecord } from "./event-record";
export { default as InstanceEvents } from "./instance-events";
