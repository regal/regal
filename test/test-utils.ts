import { inspect } from "util";
import { GameMetadata, GameOptions } from "../src/config";

export const log = (o: any, title?: string) =>
    console.log(
        `${title ? `${title}: ` : ""}${inspect(o, { depth: Infinity })}`
    );

export const getDemoMetadata = (): GameMetadata => ({
    name: "Demo Game",
    author: "Joe Cowman",
    headline: "Game Headline",
    description: "Game Description",
    homepage: "demogame.example",
    repository: "github.com/demogame",
    options: {}
});

export const metadataWithOptions = (opts: Partial<GameOptions>) => {
    const metadata = getDemoMetadata();
    (metadata as any).options = opts;
    return metadata;
};

// Throw this in the promise resolve argument for tests that should have failed promises
export const expectedPromiseFailure = () => {
    throw new Error("Promise was supposed to fail.");
};
