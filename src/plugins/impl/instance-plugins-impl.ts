import { GameInstanceInternal } from "../../state";
import { InstancePlugins, InstancePluginsInternal } from "../instance-plugins";

export const buildInstancePluginsInternal = (
    game: GameInstanceInternal
): InstancePluginsInternal => new InstancePluginsImpl(game);

class InstancePluginsImpl implements InstancePluginsInternal {
    constructor(public game: GameInstanceInternal) {}

    public buildExternal(): InstancePlugins<any> {
        return {}; // TODO - Implement
    }

    public recycle(game: GameInstanceInternal): InstancePluginsInternal {
        return new InstancePluginsImpl(game); // TODO - Implement
    }
}
