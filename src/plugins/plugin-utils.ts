import { RegalError } from "../error";
import { GameInstance } from "../state";
import { InstancePlugin, RegalPlugin, WithPlugin } from "./plugin-types";

export const definePlugin: <
    Api extends InstancePlugin<Options, GameType>,
    Key extends PropertyKey,
    Options,
    GameType extends GameInstance = GameInstance
>(
    plugin: RegalPlugin<Api, Key, Options, GameType>
) => RegalPlugin<Api, Key, Options, GameType> = plugin => {
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
) => WithPlugin<RP> = plugin => {
    return new Proxy(
        {},
        {
            get: () => {
                throw new RegalError(
                    "The object returned by registerPlugin is for typing convenience only."
                );
            }
        }
    ) as WithPlugin<typeof plugin>;
};
