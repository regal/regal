import Prando from "prando";

const SEED_LENGTH = 10;

export const generateSeed = () => {
    const THIS_IS_FAILING = new Prando().nextString(SEED_LENGTH);
    return undefined; // TODO
};
