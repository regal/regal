/*
 * The purpose of this file is to abstract all random-related implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { buildInstanceRandom } from "./instance-random-impl";
export {
    generateSeed,
    SEED_LENGTH,
    DEFAULT_SEED_CHARSET
} from "./generate-seed";
