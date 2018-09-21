/**
 * Contains the read-only container for all options in a `GameInstance`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    DEFAULT_GAME_OPTIONS,
    GameOptions,
    validateOptions
} from "./game-options";
import { MetadataManager } from "./metadata";

/** Prevents `InstanceOptions.overrides` from being modified. */
const OPTION_OVERRIDES_PROXY_HANDLER = {
    set() {
        throw new RegalError(
            "Cannot modify the properties of the InstanceOption option overrides."
        );
    }
};

/** Prevents `InstanceOptions` from being modified. */
const INSTANCE_OPTIONS_PROXY_HANDLER = {
    get(target: InstanceOptions, propertyKey: PropertyKey, receiver: object) {
        // If the option hasn't been overridden, get the default value.
        return target[propertyKey] === undefined
            ? DEFAULT_GAME_OPTIONS[propertyKey]
            : Reflect.get(target, propertyKey, receiver);
    },

    set() {
        throw new RegalError(
            "Cannot modify the properties of InstanceOptions."
        );
    }
};

/**
 * Given a value of the `allowOverrides` option, throw an error if
 * the attempted option overrides aren't valid.
 *
 * @param overrides The attempted option overrides.
 * @param allowOverrides The `allowOverrides` value to validate against.
 */
export const ensureOverridesAllowed = (
    overrides: Partial<GameOptions>,
    allowOverrides: string[] | boolean
): void => {
    if (overrides.allowOverrides !== undefined) {
        throw new RegalError(
            "The allowOverrides option can never be overridden."
        );
    }

    if (Array.isArray(allowOverrides)) {
        const overrideKeys = Object.keys(overrides);
        const forbiddenKeys = overrideKeys.filter(
            key => !allowOverrides.includes(key)
        );

        if (forbiddenKeys.length > 0) {
            throw new RegalError(
                `The following option overrides are forbidden: <${forbiddenKeys}>.`
            );
        }
    } else {
        // Option is a boolean
        if (!allowOverrides && Object.keys(overrides).length > 0) {
            throw new RegalError("No option overrides are allowed.");
        }
    }
};

/**
 * Read-only container that provides an API to view the game instance's current game options.
 */
export class InstanceOptions implements GameOptions {
    /** Game options that can be overridden by a Regal client. */
    public allowOverrides: string[] | boolean;

    /** Whether output of type `DEBUG` should be returned to the client. */
    public debug: boolean;

    /** Whether output of type `MINOR` should be returned to the client. */
    public showMinor: boolean;

    /** Options that have had their static values overridden by the client. */
    public overrides: Readonly<Partial<GameOptions>>;

    /**
     * Constructs a new `InstanceOptions` based on the options specified
     * in the static configuration, allowing for option overrides (if valid).
     *
     * @param game The game instance that owns this `InstanceOptions`.
     * @param overrides Any option overrides preferred for this specific instance.
     * Must be allowed by the static configuration's `allowOverrides` option.
     */
    constructor(public game: GameInstance, overrides: Partial<GameOptions>) {
        validateOptions(overrides);

        const configOpts = MetadataManager.getMetadata().options;
        validateOptions(configOpts);

        const allowOverrides =
            configOpts.allowOverrides !== undefined
                ? configOpts.allowOverrides
                : DEFAULT_GAME_OPTIONS.allowOverrides;

        ensureOverridesAllowed(overrides, allowOverrides);

        const overrideKeys = Object.keys(overrides);
        const configKeys = Object.keys(configOpts);

        configKeys
            .filter(key => !overrideKeys.includes(key))
            .forEach(key => (this[key] = configOpts[key]));

        overrideKeys.forEach(key => (this[key] = overrides[key]));

        this.overrides = new Proxy(overrides, OPTION_OVERRIDES_PROXY_HANDLER);
        return new Proxy(this, INSTANCE_OPTIONS_PROXY_HANDLER);
    }
}
