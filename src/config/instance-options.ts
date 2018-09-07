import { RegalError } from "../error";
import GameInstance from "../game-instance";
import {
    DEFAULT_GAME_OPTIONS,
    GameOptions,
    validateOptions
} from "./game-options";

const OPTION_OVERRIDES_PROXY_HANDLER = {
    set(
        target: Partial<GameOptions>,
        propertKey: PropertyKey,
        value: any,
        receiver: object
    ) {
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

    set(
        target: InstanceOptions,
        propertKey: PropertyKey,
        value: any,
        receiver: object
    ) {
        throw new RegalError(
            "Cannot modify the properties of InstanceOptions."
        );
    }
};

const ensureOverridesAllowed = (
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
        this.overrides = new Proxy(overrides, OPTION_OVERRIDES_PROXY_HANDLER);

        validateOptions(overrides);

        Object.keys(overrides).forEach(key => (this[key] = overrides[key]));

        return new Proxy(this, INSTANCE_OPTIONS_PROXY_HANDLER);
    }

    public setOptions(newOpts: Partial<GameOptions>): void {
        validateOptions(newOpts);
        ensureOverridesAllowed(newOpts, this.allowOverrides);

        const currentOverrideKeys = Object.keys(this.overrides);
        const newOverrideKeys = Object.keys(newOpts);
        const newOverrides: Partial<GameOptions> = {};

        currentOverrideKeys
            .filter(key => !newOverrideKeys.includes(key)) // Don't handle options that are going to get overridden.
            .forEach(key => (newOverrides[key] = this.overrides[key]));

        newOverrideKeys.forEach(key => {
            newOverrides[key] = newOpts[key];
            this[key] = newOpts[key];
        });

        this.overrides = newOverrides;
    }
}
