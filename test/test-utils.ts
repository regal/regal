import { inspect } from "util";
import { GameMetadata, GameOptions } from "../src/config";
import { version as regalVersion } from "../package.json";
import { Agent } from "../src";
import { expect } from "chai";
import { gameInstancePK } from "../src/agents";

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

export enum TestProperty {
    REQUIRE_BUT_SKIP
}

export const smartObjectEquals = (actual: object, expected: object) => {
    // Test property key match
    const expectedKeys = Object.keys(expected).sort();
    const actualKeys = Object.keys(actual).sort();
    expect(actualKeys).to.deep.equal(expectedKeys);

    for (const prop in expected) {
        const expectedVal = expected[prop];
        if (expectedVal !== TestProperty.REQUIRE_BUT_SKIP) {
            expect(actual[prop]).to.deep.equal(expectedVal);
        }
    }
};

export const pks = (additional: number) => {
    const result = [gameInstancePK()];
    for (let i = 0; i < additional; i++) {
        result.push(result[result.length - 1].plus(1));
    }
    return result;
};
