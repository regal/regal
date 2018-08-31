/**
 * Component for creating and handling events in the Regal Game Library.
 *
 * @since 0.3.0
 * @author Joe Cowman
 * @license MIT (see https://github.com/regal/regal)
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
export { InstanceEvents } from "./instance-events";
