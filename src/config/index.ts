/*
 * Component for configuring the behavior of the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceOptions } from "./instance-options";
export { InstanceOptionsInternal } from "./instance-options-internal";
export { GameOptions, DEFAULT_GAME_OPTIONS, OPTION_KEYS } from "./game-options";
export { GameMetadata } from "./game-metadata";
export { MetadataManager } from "./metadata-manager";
export {
    buildInstanceOptions,
    ensureOverridesAllowed,
    validateOptions
} from "./impl";
