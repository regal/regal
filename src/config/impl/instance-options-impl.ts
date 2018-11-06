import { RegalError } from "../../error";
import GameInstance from "../../game-instance";
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
 */
export const buildInstanceOptions = (
    game: GameInstance,
    overrides: Partial<GameOptions>
): InstanceOptions => new InstanceOptionsImpl(game, overrides);

class InstanceOptionsImpl implements InstanceOptions {
    public allowOverrides: string[] | boolean;
    public debug: boolean;
    public showMinor: boolean;
    public trackAgentChanges: boolean;

    public readonly overrides: Partial<GameOptions>;

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
