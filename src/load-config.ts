import * as cosmiconfig from "cosmiconfig";
import { GameMetadata, GameOptions, MetadataManager } from "./config";
import { validateOptions } from "./config";
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

export const readConfigFile = async (
    location?: string
): Promise<GameMetadata> => {
    let result;

    try {
        result = await explorer.search(location);
    } catch (e) {
        throw new RegalError(
            `An error occurred while attempting to read the config file: <${e}>.`
        );
    }

    if (!result) {
        throw new RegalError("No metadata could be found for the game.");
    }

    const name = result.config.name as string;
    if (!name) {
        throw new RegalError("The project's name must be defined.");
    }

    let options = result.config.options as Partial<GameOptions>;
    if (!options) {
        options = {};
    }

    const metadata: GameMetadata = {
        name,
        options
    };

    metadataOptionalStrings.forEach(key => {
        if (result.config[key] !== undefined) {
            metadata[key] = result.config[key];
        }
    });

    validateOptions(metadata.options);

    return metadata;
};

export const loadConfig = async (location?: string) => {
    return readConfigFile(location)
        .then(MetadataManager.setMetadata)
        .catch(err => {
            throw new RegalError(
                `An error occurred while attempting to load the config file: <${err}>.`
            );
        });
};
