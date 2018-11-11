/**
 * Contains `MetadataManager`, the static class that manages game metadata.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import { GameMetadata } from "./game-metadata";

/**
 * Static manager for every game instance's metadata.
 */
export class MetadataManager {
    /**
     * Returns the game's metadata, if it has been set.
     *
     * If it hasn't been set (i.e. the static configuration was never loaded),
     * an error will be thrown.
     */
    public static getMetadata(): GameMetadata {
        if (MetadataManager._metadata === undefined) {
            throw new RegalError(
                "Metadata is not defined. Did you remember to load the config?"
            );
        }

        return MetadataManager._metadata;
    }

    /**
     * Sets the static metadata for all instances of this game.
     * @param metadata The game's metadata.
     */
    public static setMetadata(metadata: GameMetadata): void {
        MetadataManager._metadata = metadata;
    }

    /**
     * Clears the game's metadata.
     */
    public static reset(): void {
        MetadataManager._metadata = undefined;
    }

    /** Internal property for the game's metadata. */
    private static _metadata: GameMetadata;
}