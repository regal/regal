import * as cosmiconfig from "cosmiconfig";
import { GameMetadata, GameOptions } from "./config";
import { RegalError } from "./error";

const explorer = cosmiconfig("regal", {
    searchPlaces: ["package.json", "regal.json"]
});

const metadataOptionalStrings = [
    "author",
    "headline",
    "description",
    "homepage",
    "repository"
];

export const readConfigFile = (location: string): GameMetadata => {
    const result =
        location === undefined
            ? explorer.searchSync()
            : explorer.searchSync(location);

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
