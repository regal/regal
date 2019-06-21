import { PK, PKProvider, ReservedPKSet } from "../keys";
import { PKImpl } from "./pk-impl";
import { PKProviderImpl } from "./pk-provider-impl";

export const buildPKProvider = <T>(reserved: ReservedPKSet<T>): PKProvider<T> =>
    new PKProviderImpl(reserved);

export const buildPK = <T>(value: number): PK<T> => new PKImpl(value);
