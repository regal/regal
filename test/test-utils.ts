import { inspect } from "util";
import { GameMetadata, GameOptions } from "../src/config";
import { version as regalVersion } from "../package.json";
import { Agent } from "../src";

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
    options: {},
    gameVersion: "1.2.1"
});

export const metadataWithOptions = (opts: Partial<GameOptions>) => {
    const metadata = getDemoMetadata();
    (metadata as any).options = opts;
    return metadata;
};

export const metadataWithVersion = (metadata: GameMetadata): GameMetadata => ({
    author: metadata.author,
    description: metadata.description,
    gameVersion: metadata.gameVersion,
    headline: metadata.headline,
    homepage: metadata.homepage,
    name: metadata.name,
    options: metadata.options,
    regalVersion,
    repository: metadata.repository
});

export const libraryVersion = regalVersion;

export class Dummy extends Agent {
    constructor(public name: string, public health: number) {
        super();
    }
}

export const makeAgents = (startFrom: number, amount: number) => {
    let num = startFrom;
    let i = amount;
    const arr = [];

    while (i-- > 0) {
        arr.push(new Dummy(`D${num}`, num));
        num++;
    }

    return arr;
};
