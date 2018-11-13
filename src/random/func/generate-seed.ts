import Prando from "prando";

export const SEED_LENGTH = 10;

export const generateSeed = () => new Prando().nextString(SEED_LENGTH);
