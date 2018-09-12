import * as cosmiconfig from "cosmiconfig";
import { RegalError } from "../error";
import { GameOptions } from "./game-options";

const explorer = cosmiconfig("regal", {
    searchPlaces: ["package.json", "regal.json"]
});

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

const metadataOptionalStrings = [
    "author",
    "headline",
    "description",
    "homepage",
    "repository"
];

export class MetadataManager {
    public static configLocation: string;

    public static getMetadata(): GameMetadata {
        return MetadataManager._retrievalFunction();
    }

    public static forceConfig(config: GameMetadata): void {
        MetadataManager._retrievalFunction = () => config;
    }

    public static reset(): void {
        MetadataManager._retrievalFunction = MetadataManager._accessConfigFile;
        MetadataManager.configLocation = undefined;
    }

    /* tslint:disable:member-ordering */

    private static _accessConfigFile = (): GameMetadata => {
        const result =
            MetadataManager.configLocation === undefined
                ? explorer.searchSync()
                : explorer.searchSync(MetadataManager.configLocation);

        if (result.isEmpty) {
            throw new RegalError("No metadata could be found for the game.");
        }

        const metadata: GameMetadata = {
            name: result.config.name as string,
            options: result.config.options as Partial<GameOptions>
        };

        metadataOptionalStrings.forEach(key => {
            if (result.config[key] !== undefined) {
                metadata[key] = result.config[key];
            }
        });

        return metadata;
    };

    private static _retrievalFunction = MetadataManager._accessConfigFile;
}
