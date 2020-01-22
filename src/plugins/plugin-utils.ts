import { GameInstance } from "../state";
import { InstancePlugin, RegalPlugin } from "./plugin-types";

export const definePlugin: <
    Api extends InstancePlugin<Options, GameType>,
    Key extends PropertyKey,
    Options,
    GameType extends GameInstance
>(
    plugin: RegalPlugin<Api, Key, Options, GameType>
) => RegalPlugin<Api, Key, Options, GameType> = plugin => {
    return plugin;
};
