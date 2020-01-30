/*
 * Public exports from the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { Agent, AgentMeta, AgentId, AgentProtoId } from "./agents";
export { RegalError } from "./error";
export {
    EventFunction,
    TrackedEvent,
    EventQueue,
    noop,
    InstanceEvents,
    enqueue,
    nq,
    on,
    GameEventBuilder,
    EventId
} from "./events";
export {
    Game,
    GameResponse,
    GameResponseOutput,
    onPlayerCommand,
    onStartCommand,
    onBeforeUndoCommand,
    GameApi,
    GameApiExtended
} from "./api";
export {
    GameOptions,
    GameMetadata,
    PluginMetadata,
    GeneratedGameMetadata,
    InstanceOptions
} from "./config";
export { GameInstance } from "./state";
export { OutputLineType, OutputLine, InstanceOutput } from "./output";
export { InstanceRandom, Charsets } from "./random";
export {
    RegalPlugin,
    InstancePlugin,
    PluginArgs,
    WithPlugin,
    SimplifiedPlugin,
    InstancePluginBase,
    InstancePlugins,
    PluginOptionSchema,
    PluginOptionSchemaEntry,
    RegisteredPlugins,
    definePlugin,
    registerPlugin
} from "./plugins";
export { PK } from "./common";
