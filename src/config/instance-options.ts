import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    DEFAULT_GAME_OPTIONS,
    GameOptions,
    validateOptions
} from "./game-options";
import { MetadataManager } from "./metadata";

const OPTION_OVERRIDES_PROXY_HANDLER = {
    set() {
        throw new RegalError(
            "Cannot modify the properties of the InstanceOption option overrides."
        );
    }
};

const INSTANCE_OPTIONS_PROXY_HANDLER = {
    get(target: InstanceOptions, propertyKey: PropertyKey, receiver: object) {
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

export class InstanceOptions implements GameOptions {
    public allowOverrides: string[] | boolean;
    public debug: boolean;
    public showMinor: boolean;

    public overrides: Readonly<Partial<GameOptions>>;

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
