import { RegalError } from "../error";
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

export class MetadataManager {
    public static configLocation: string;

    public static getMetadata(): GameMetadata {
        if (MetadataManager._metadata === undefined) {
            throw new RegalError(
                "Metadata is not defined. Did you remember to load the config?"
            );
        }

        return MetadataManager._metadata;
    }

    public static setMetadata(metadata: GameMetadata): void {
        MetadataManager._metadata = metadata;
    }

    public static reset(): void {
        MetadataManager._metadata = undefined;
    }

    private static _metadata: GameMetadata;
}
