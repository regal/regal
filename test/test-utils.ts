import { inspect } from "util";
import { GameMetadata, GameOptions } from "../src/config";
import { version as regalVersion } from "../package.json";

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

export const metadataWithVersion = (metadata: GameMetadata): GameMetadata => ({
    author: metadata.author,
    description: metadata.description,
    headline: metadata.headline,
    homepage: metadata.homepage,
    name: metadata.name,
    options: metadata.options,
    regalVersion,
    repository: metadata.repository
});

export const libraryVersion = regalVersion;
