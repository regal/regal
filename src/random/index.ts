/*
 * Component for generating deterministic pseudo-random data in the Regal Game Library.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { InstanceRandom } from "./instance-random";
export { InstanceRandomInternal } from "./instance-random-internal";
export {
    buildInstanceRandom,
    generateSeed,
    SEED_LENGTH,
    DEFAULT_SEED_CHARSET
} from "./impl";
export { RandomRecord, RandomRecordId } from "./random-record";

import * as Charsets from "./charsets";
export { Charsets };
