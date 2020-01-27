import { GameInstance } from "../../state";
import { PluginManager } from "../plugin-manager";
import { InstancePlugin, RegalPlugin } from "../plugin-types";

export const definePlugin: <
    Api extends InstancePlugin<Options, GameType>,
    Key extends PropertyKey,
    Options,
    GameType extends GameInstance = GameInstance
>(
    plugin: RegalPlugin<Api, Key, Options, GameType>
) => RegalPlugin<Api, Key, Options, GameType> = plugin => {
    PluginManager.validatePlugin(plugin);
    return plugin;
};

export const registerPlugin: <
    RP extends RegalPlugin<Api, Key, Options, GameType>,
    Api extends InstancePlugin<Options, GameType>,
    Key extends PropertyKey,
    Options,
    GameType extends GameInstance = GameInstance
>(
    plugin: RP
) => void = plugin => {
    PluginManager.registerPlugin(plugin);
};
