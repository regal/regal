import { GameInstance } from "../state";
import { PluginOptionSchema } from "./plugin-options";

export interface RegalPlugin<
    Api extends InstancePlugin<Options, GameType>,
    Key extends PropertyKey,
    Options,
    GameType extends GameInstance = GameInstance
> {
    name: string;
    key: Key;
    version?: string;
    options: PluginOptionSchema<Options>;
    onConstructApi: (pluginConstructorArgs: PluginConstructorArgs<Api>) => Api;
}

export interface InstancePlugin<
    Options = object,
    GameType extends GameInstance = GameInstance
> {
    options: Options;
    game: GameType;
}

export type PluginConstructorArgs<IP> = IP extends InstancePlugin<
    infer Options,
    infer GameType
>
    ? { options: Options; game: GameType }
    : never;
