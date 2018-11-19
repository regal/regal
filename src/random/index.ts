/*
 * Component for generating deterministic pseudo-random data in the Regal Game Library.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

export { generateSeed } from "./func/generate-seed";
export { InstanceRandom } from "./instance-random";
export { buildInstanceRandom } from "./impl";
export { recycleInstanceRandom } from "./func/recycle-instance-random";
export {
    EXPANDED_CHARSET,
    ALHPANUMERIC_CHARSET,
    ALPHABET_CHARSET,
    NUMBERS_CHARSET
} from "./charsets";
