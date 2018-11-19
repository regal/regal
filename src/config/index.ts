/*
 * Component for configuring the behavior of the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceOptions } from "./instance-options";
export {
    ensureOverridesAllowed,
    validateOptions
} from "./func/validate-options";
export { GameOptions, DEFAULT_GAME_OPTIONS, OPTION_KEYS } from "./game-options";
export { GameMetadata } from "./game-metadata";
export { MetadataManager } from "./metadata-manager";
export { buildInstanceOptions } from "./impl";
