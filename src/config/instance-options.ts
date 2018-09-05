import { RegalError } from "../error";
import GameInstance from "../game-instance";
import { DEFAULT_GAME_OPTIONS, GameOptions, OPTION_KEYS } from "./game-options";

const OPTION_OVERRIDES_PROXY_HANDLER = {
    set(
        target: Partial<GameOptions>,
        propertKey: PropertyKey,
        value: any,
        receiver: object
    ) {
        throw new RegalError(
            "Cannot modify the properties of the instance overrides."
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
    public debug: boolean;
    public forbidChanges: string[] | boolean;
    public showMinor: boolean;

    public overrides: Readonly<Partial<GameOptions>>;

    constructor(public game: GameInstance, overrides: Partial<GameOptions>) {
        this.overrides = new Proxy(overrides, OPTION_OVERRIDES_PROXY_HANDLER);

        const overrideKeys = Object.keys(overrides);

        overrideKeys.forEach(key => {
            // Ensure no extraneous options were included.
            if (!OPTION_KEYS.includes(key)) {
                throw new RegalError(`Invalid option name <${key}>.`);
            }

            // Ensure that each overriden option has the correct type.
            // TODO - this doesn't work well for nonprimitive options. Perhaps each one should be validated seperately.
            if (typeof overrides[key] !== typeof DEFAULT_GAME_OPTIONS[key]) {
                throw new RegalError(
                    `The option <${key}> is of type <${typeof overrides[
                        key
                    ]}>, must be of type <${typeof DEFAULT_GAME_OPTIONS[key]}>.`
                );
            }

            this[key] = overrides[key];
        });

        return new Proxy(this, INSTANCE_OPTIONS_PROXY_HANDLER);
    }
}
