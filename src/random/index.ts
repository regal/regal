/*
 * Component for generating deterministic pseudo-random data in the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
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
export {
    EXPANDED_CHARSET,
    ALHPANUMERIC_CHARSET,
    ALPHABET_CHARSET,
    NUMBERS_CHARSET
} from "./charsets";
