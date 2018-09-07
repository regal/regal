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
}
