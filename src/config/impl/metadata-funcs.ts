/*
 * Contains functions for mutating game metadata.
 *
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { version as regalVersion } from "../../../package.json";
import { RegalError } from "../../error";
import { GameMetadata, METADATA_KEYS } from "../game-metadata";
import { GameOptions, OPTION_KEYS } from "../game-options";
import { checkPropertyType, validateOptions } from "./validate-options";

/** Safe copies an allowOverrides option. */
const copyAllowOverrides = (opt: string[] | boolean) =>
    Array.isArray(opt) ? opt.map(str => str) : opt;

/** Safe copies a partial GameOptions object. */
const copyOptions = (opts: Partial<GameOptions>): Partial<GameOptions> => {
    const copies = {} as any; // Writeable GameOptions

    if (opts.allowOverrides !== undefined) {
        copies.allowOverrides = copyAllowOverrides(opts.allowOverrides);
    }

    for (const opt of OPTION_KEYS.filter(key => key !== "allowOverrides")) {
        if (opts[opt] !== undefined) {
            copies[opt] = opts[opt];
        }
    }

    return copies;
};

/** Safe copies a metadata object. */
export const copyMetadata = (md: GameMetadata): GameMetadata => ({
    author: md.author,
    description: md.description,
    gameVersion: md.gameVersion,
    headline: md.headline,
    homepage: md.homepage,
    name: md.name,
    options: copyOptions(md.options),
    regalVersion,
    repository: md.repository
});

const optionalStringProps: Array<keyof GameMetadata> = [
    "headline",
    "description",
    "homepage",
    "repository",
    "gameVersion"
];

/**
 * Throws an error if any of the given metadata properties are invalid.
 * This should be called before auto-generated properties, like regalVersion, are created.
 * @param md The metadata object.
 */
export const validateMetadata = (md: GameMetadata): void => {
    Object.keys(md).forEach(key => {
        if (!METADATA_KEYS.includes(key)) {
            throw new RegalError(`Invalid metadata property <${key}>.`);
        }
    });

    const checkMdPropType = (
        key: keyof GameMetadata,
        expectedType: string,
        allowUndefined: boolean
    ) =>
        checkPropertyType(
            md,
            key,
            expectedType,
            allowUndefined,
            "metadata property"
        );

    checkMdPropType("name", "string", false);
    checkMdPropType("author", "string", false);

    for (const prop of optionalStringProps) {
        checkMdPropType(prop, "string", true);
    }

    checkMdPropType("options", "object", false);
    validateOptions(md.options);
};
