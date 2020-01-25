import { GameInstanceInternal } from "../state";
import { InstancePlugin, SimplifiedPlugin } from "./plugin-types";

export interface RegisteredPlugins {
    [k: string]: SimplifiedPlugin<InstancePlugin<any>>;
}

export type InstancePlugins<Plugins extends RegisteredPlugins> = {
    [P in keyof Plugins]: SimplifiedPlugin<Plugins[P]>
};

export interface InstancePluginsInternal {
    readonly game: GameInstanceInternal;
    recycle(game: GameInstanceInternal): InstancePluginsInternal;
    buildExternal(): InstancePlugins<any>;
}
