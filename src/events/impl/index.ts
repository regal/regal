/**
 * The purpose of this file is to abstract all event-related implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { buildInstanceEvents } from "./instance-events-impl";
export { buildEventQueue, buildThenMethod } from "./event-queue-impl";
export { buildEventRecord } from "./event-record-impl";
