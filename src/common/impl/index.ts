import { PK, PKProvider, ReservedPKSet } from "../keys";
import { NumericPKImpl } from "./pk-impl";
import { PKProviderImpl } from "./pk-provider-impl";

export const buildPK = <T>(value: number): PK<T> => new NumericPKImpl(value);

export const buildPKProvider = <T>(
    reserved?: ReservedPKSet<T>
): PKProvider<T> => new PKProviderImpl(buildPK, reserved);
