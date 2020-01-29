import { EventId } from "../events";
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
    onConstructApi: (pluginArgs: PluginArgs<Options, GameType>) => Api;
}

export interface InstancePlugin<
    Options = object,
    GameType extends GameInstance = GameInstance
> extends InstancePluginControls<Options, GameType> {
    options: Options;
}

interface InstancePluginControls<Options, GameType extends GameInstance> {
    game: GameType;

    recycle: (
        pluginArgs: PluginArgs<Options, GameType>
    ) => InstancePlugin<Options, GameType>;

    revert: (
        revertTo: EventId,
        pluginArgs: PluginArgs<Options, GameType>
    ) => InstancePlugin<Options, GameType>;
}

// export type PluginArgs<IP = InstancePlugin> = IP extends InstancePlugin<
//     infer Options,
//     infer GameType
// >
//     ? { options: Options; game: GameType }
//     : never;

export interface PluginArgs<
    Options = object,
    GameType extends GameInstance = GameInstance
> {
    options: Options;
    game: GameType;
}

export type WithPlugin<RP> = RP extends RegalPlugin<
    infer Api,
    infer Key,
    infer _Options,
    infer _GameType
>
    ? { [k in Key]: Api }
    : never;

export type SimplifiedPlugin<IP> = IP extends InstancePlugin<
    infer Options,
    infer GameType
>
    ? Pick<
          IP,
          Exclude<keyof IP, keyof InstancePluginControls<Options, GameType>>
      >
    : never;