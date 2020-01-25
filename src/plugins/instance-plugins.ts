import { GameInstanceInternal } from "../state";
import { InstancePlugin, SimplifiedPlugin } from "./plugin-types";

interface GameInstancePlugins {
    [k: string]: SimplifiedPlugin<InstancePlugin<any>>;
}

export type InstancePlugins<Plugins extends GameInstancePlugins> = {
    [P in keyof Plugins]: SimplifiedPlugin<Plugins[P]>
};

interface InstancePluginsInternalMethods {
    recycle(game: GameInstanceInternal): GameInstanceInternal;
}

export type InstancePluginsInternal<
    Plugins extends GameInstancePlugins
> = InstancePlugins<Plugins> & InstancePluginsInternalMethods;
