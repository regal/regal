import Prando from "prando";

const SEED_LENGTH = 10;

export const generateSeed = () => new Prando().nextString(SEED_LENGTH);
