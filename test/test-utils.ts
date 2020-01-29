import { GameMetadata, GameOptions } from "../src/config";
import { version as regalVersion } from "../package.json";
import { expect } from "chai";
import { Game, Agent, OutputLine, PK, AgentId } from "../src";
import { buildPKProvider } from "../src/common";
import { RandomRecord } from "../src/random";
import { getGameInstancePK } from "../src/agents";
import { getUntrackedEventPK } from "../src/events";
import { getInstanceStateAgentProtoPK } from "../src/agents/impl/prototype/agent-proto-keys";

// log had to be moved to its own file to eliminate circular dependencies
// when used to debug src
export { log } from "./test-log";

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

export const gameInit = () => Game.init(getDemoMetadata());

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
    REQUIRE_BUT_SKIP,
    SMART_OBJECT
}

export interface SmartObject {
    prop: TestProperty;
    object: object;
}

export const smartObj = (obj: object): SmartObject => ({
    prop: TestProperty.SMART_OBJECT,
    object: obj
});

export const isSmartObject = (obj: any): obj is SmartObject =>
    obj !== undefined && obj.prop !== undefined;

export const smartObjectEquals = (actual: object, expected: object) => {
    // Test property key match
    const expectedKeys = Object.keys(expected).sort();
    const actualKeys = Object.keys(actual).sort();
    expect(actualKeys).to.deep.equal(expectedKeys);

    for (const prop in expected) {
        const actualVal = actual[prop];
        const expectedVal = expected[prop];

        if (isSmartObject(expectedVal)) {
            smartObjectEquals(actualVal, expectedVal.object);
        } else if (expectedVal !== TestProperty.REQUIRE_BUT_SKIP) {
            expect(actualVal).to.deep.equal(expectedVal);
        }
    }
};

export const getInitialOutputPK = () => buildPKProvider<OutputLine>().next();

export const getInitialRandomPK = () => buildPKProvider<RandomRecord>().next();

const pks = <T>(additional: number, initialPK: PK<T>) => {
    const result = [initialPK];
    for (let i = 0; i < additional; i++) {
        result.push(result[result.length - 1].plus(1));
    }
    return result;
};

// Agent PKs
export const aPKs = (additional: number) =>
    pks(additional, getGameInstancePK());

// OutputLine PKs
export const oPKs = (additional: number) =>
    pks(additional, getInitialOutputPK());

// EventRecord PKs
export const ePKs = (additional: number) =>
    pks(additional, getUntrackedEventPK());

export const ePKAtNum = (index: number) => getUntrackedEventPK().plus(index);

// RandomRecord PKs
export const rPKs = (additional: number) =>
    pks(additional, getInitialRandomPK());

// AgentProto PKs
export const aprPKs = (additional: number) =>
    pks(additional, getInstanceStateAgentProtoPK());

export const testMeta = (id: AgentId) => {
    const meta = {
        id,
        protoId: TestProperty.REQUIRE_BUT_SKIP
    };
    return smartObj(meta);
};
