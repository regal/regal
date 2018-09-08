import { GameOptions } from "./game-options";

/**
 * Metadata about the game, such as its title and author.
 */
export interface GameMetadata {
    /** The game's title. */
    name: string;

    /** The game's author. */
    author?: string;

    /** A brief description of the game. */
    headline?: string;

    /** The full description of the game. */
    description?: string;

    /** The URL of the project's homepage. */
    homepage?: string;

    /** The URL of the project's repository */
    repository?: string;

    /** User-defined values for the game's options. */
    options: Partial<GameOptions>;
}

const accessConfigFile = (): GameMetadata => {
    throw new Error("Not yet implemented."); // TODO
};

export class MetadataManager {
    public static getMetadata(): GameMetadata {
        return this._retrievalFunction();
    }

    public static forceConfig(config: GameMetadata): void {
        this._retrievalFunction = () => config;
    }

    public static reset(): void {
        this._retrievalFunction = accessConfigFile;
    }

    private static _retrievalFunction = accessConfigFile;
}
