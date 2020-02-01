import { mapObject } from "../../common";
import { GameInstanceInternal } from "../../state";
import { InstancePlugins, InstancePluginsInternal } from "../instance-plugins";
import { PluginManager } from "../plugin-manager";
import { InstancePlugin } from "../plugin-types";

export const buildInstancePluginsInternal = (
    game: GameInstanceInternal
): InstancePluginsInternal => new InstancePluginsImpl(game);

class InstancePluginsImpl implements InstancePluginsInternal {
    constructor(public game: GameInstanceInternal) {}

    public buildExternal(): InstancePlugins<any> {
        return PluginManager.getPluginsConstructor()(this.game, {}); // TODO - Implement options
    }

    public recycle(game: GameInstanceInternal): InstancePluginsInternal {
        return new InstancePluginsImpl(game);
    }
}
