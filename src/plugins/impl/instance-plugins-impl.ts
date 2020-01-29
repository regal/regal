import { mapObject } from "../../common";
import { GameInstanceInternal } from "../../state";
import { InstancePlugins, InstancePluginsInternal } from "../instance-plugins";
import { PluginManager } from "../plugin-manager";
import { InstancePlugin } from "../plugin-types";

export const buildInstancePluginsInternal = (
    game: GameInstanceInternal
): InstancePluginsInternal => new InstancePluginsImpl(game);

class InstancePluginsImpl implements InstancePluginsInternal {
    constructor(
        public game: GameInstanceInternal,
        private _external?: InstancePlugins<any>
    ) {}

    public buildExternal(): InstancePlugins<any> {
        if (this._external) {
            return this._external;
        }
        return PluginManager.getPluginsConstructor()(this.game, {}); // TODO - Implement options
    }

    public recycle(game: GameInstanceInternal): InstancePluginsInternal {
        const recycled = mapObject<InstancePlugin, InstancePlugin>(
            this.game.plugins,
            plugin => plugin.recycle(game)
        );
        return new InstancePluginsImpl(game, recycled);
    }
}
