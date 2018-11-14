/**
 * Contains the current implementation of `InstanceOptions`.
 *
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */

import { RegalError } from "../../error";
import { generateSeed } from "../../random";
import { GameInstance } from "../../state";
import {
    ensureOverridesAllowed,
    validateOptions
} from "../func/validate-options";
import { DEFAULT_GAME_OPTIONS, GameOptions } from "../game-options";
import { InstanceOptions } from "../instance-options";
import { MetadataManager } from "../metadata-manager";

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
 * Builds a new `InstanceOptions` based on the options specified
 * in the static configuration, allowing for option overrides (if valid).
 *
 * @param game The game instance that owns this `InstanceOptions`.
 * @param overrides Any option overrides preferred for this specific instance.
 * Must be allowed by the static configuration's `allowOverrides` option.
 * @param generatedSeed Include if the previous GameInstance had a default-generated seed
 */
export const buildInstanceOptions = (
    game: GameInstance,
    overrides: Partial<GameOptions>,
    generatedSeed?: string
): InstanceOptions => new InstanceOptionsImpl(game, overrides, generatedSeed);

class InstanceOptionsImpl implements InstanceOptions {
    public allowOverrides: string[] | boolean;
    public debug: boolean;
    public showMinor: boolean;
    public trackAgentChanges: boolean;
    public seed: string;

    public readonly overrides: Partial<GameOptions>;

    constructor(
        public game: GameInstance,
        overrides: Partial<GameOptions>,
        generatedSeed?: string
    ) {
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

        // If passed a specified seed (as in generated by a previous GameInstance), use it.
        // Otherwise, generate a new one.
        if (this.seed === undefined) {
            this.seed =
                generatedSeed !== undefined ? generatedSeed : generateSeed();
        }

        this.overrides = new Proxy(overrides, OPTION_OVERRIDES_PROXY_HANDLER);
        return new Proxy(this, INSTANCE_OPTIONS_PROXY_HANDLER);
    }
}
