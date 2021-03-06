/*
 * The purpose of this file is to abstract all config-related implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { buildInstanceOptions } from "./instance-options-impl";
export { validateOptions, ensureOverridesAllowed } from "./validate-options";
export { copyMetadata, validateMetadata } from "./metadata-funcs";
