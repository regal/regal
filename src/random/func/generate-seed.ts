import Prando from "prando";
import { EXPANDED_CHARSET } from "../charsets";

// This results in 89^10 possible seeds
export const SEED_LENGTH = 10;
export const DEFAULT_SEED_CHARSET = EXPANDED_CHARSET;

export const generateSeed = () =>
    new Prando().nextString(SEED_LENGTH, DEFAULT_SEED_CHARSET);
