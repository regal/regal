/*
 * Contains functions for loading the static configuration of a Regal game
 * from a `regal.json` file or `package.json`'s `regal` property using cosmiconfig.
 *
 * This file should not be bundled with deployed Regal games, but rather should
 * be run by a pre-processor to load the configuration and then package it
 * with the game before it's deployed.
 *
 * If a game developer is unit testing their game before it's bundled, they
 * may have to call these functions manually in their test script.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

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

/**
 * Attempts to generate and validate a `GameMetadata` object asynchronously
 * from a `regal.json` file or `package.json`'s `regal` property, starting
 * at the given directory (or the working directory) and searching upward.
 *
 * @param location The directory in which to begin searching for the config (optional).
 *
 * @returns A promise that resolves to the parsed `GameMetadata`.
 */
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

    // Retain only expected properties from the config file.
    metadataOptionalStrings.forEach(key => {
        if (result.config[key] !== undefined) {
            metadata[key] = result.config[key];
        }
    });

    validateOptions(metadata.options);

    return metadata;
};

/**
 * Calls `readConfigFile` and sets the returned object in the
 * game's static context, resolving when that's done or throwing an error.
 *
 * @param location The directory in which to begin searching for the config (optional).
 */
export const loadConfig = async (location?: string) => {
    return readConfigFile(location)
        .then(MetadataManager.setMetadata)
        .catch(err => {
            throw new RegalError(
                `An error occurred while attempting to load the config file: <${err}>.`
            );
        });
};
