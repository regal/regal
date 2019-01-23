/*
 * Contains generateSeed function and related configuration.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import Prando from "prando";
import { EXPANDED_CHARSET } from "../charsets";

// Note: the following configuration results in 89^10 possible seeds

/** Default length of seeds generated by `InstanceOptions` when none is specified. */
export const SEED_LENGTH = 10;
/** Default charset used to generate seeds within `InstanceOptions` when none is specified. */
export const DEFAULT_SEED_CHARSET = EXPANDED_CHARSET;

/**
 * Generates a pseudo-random seed to use in further pseudo-random data generation.
 */
export const generateSeed = () =>
    new Prando().nextString(SEED_LENGTH, DEFAULT_SEED_CHARSET);
