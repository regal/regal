import { RegalError } from "./error";
import GameInstance from "./game-instance";

/**
 * Represents game options that are configurable by a Regal client.
 */
export interface GameOptions {
    /** Whether output of type `DEBUG` should be returned to the client. Defaults to false. */
    debug: boolean;

    /**
     * Game options that cannot be changed by a Regal client.
     * Can be an array of strings or a boolean.
     *
     * If an array of strings, these options will not be configurable by a Regal client.
     * If `true`, no options will be configurable.
     * If `false`, all options will be configurable.
     */
    forbidChanges: string[] | boolean;

    /** Whether output of type `MINOR` should be returned to the client. Defaults to true. */
    showMinor: boolean;
}

export const DEFAULT_GAME_OPTIONS: GameOptions = {
    debug: false,
    forbidChanges: false,
    showMinor: true
};

const OPTION_KEYS = Object.keys(DEFAULT_GAME_OPTIONS);

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

    constructor(
        public game: GameInstance,
        public overrides: Readonly<Partial<GameOptions>>
    ) {
        const overrideKeys = Object.keys(overrides);

        overrideKeys.forEach(key => {
            // Ensure no extraneous options were included.
            if (!OPTION_KEYS.includes(key)) {
                throw new RegalError(`Invalid option name <${key}>.`);
            }

            // Ensure that each overriden option has the correct type.
            if (typeof overrides[key] !== typeof DEFAULT_GAME_OPTIONS[key]) {
                throw new RegalError(
                    `The option <${key}> is of type ${typeof overrides[
                        key
                    ]}, must be of type ${typeof DEFAULT_GAME_OPTIONS[key]}`
                );
            }
        });

        return new Proxy(this, INSTANCE_OPTIONS_PROXY_HANDLER);
    }
}

/**
 * Metadata about the game, such as its title and author.
 */
export interface GameMetadata {
    /** The game's title. */
    name: string;

    /** The game's author. */
    author?: string;

    /** A brief description of the game. */
    headline?: string;

    /** The full description of the game. */
    description?: string;

    /** The URL of the project's homepage. */
    homepage?: string;

    /** The URL of the project's repository */
    repository?: string;

    /** Default values for the game's options. */
    options: GameOptions;
}
