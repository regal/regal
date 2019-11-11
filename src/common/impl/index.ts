/*
 * The purpose of this file is to abstract all common utility implementations
 * by re-exporting their constructors from a single file.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { PK, PKProvider, ReservedPKSet } from "../keys";
import { NumericPKImpl } from "./pk-impl";
import { PKProviderImpl } from "./pk-provider-impl";

/** Builds a `PK`. */
export const buildPK = <T>(value: number): PK<T> => new NumericPKImpl(value);

/** Builds a `PKProvider`. */
export const buildPKProvider = <T>(
    reserved?: ReservedPKSet<T>
): PKProvider<T> => PKProviderImpl.build(buildPK, reserved);
