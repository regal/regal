import { mapObject } from "../common";
import { RegalError } from "../error";
import { ContextManager, GameInstanceInternal } from "../state";
import { PluginOptionSchemaEntry } from "./plugin-options";
import { InstancePlugin, PluginArgs, RegalPlugin } from "./plugin-types";

type RegalPluginAny = RegalPlugin<any, any, any, any>;

export type PluginsConstructor = (
    game: GameInstanceInternal,
    options: object
) => { [key: string]: InstancePlugin };

export class PluginManager {
    public static init(): void {
        if (this._isInitialized) {
            throw new RegalError("PluginManager has already been initialized");
        }

        this._isInitialized = true;
        const pluginConstructors = {};

        for (const regalPlugin of this._plugins) {
            pluginConstructors[regalPlugin.key] = this._getPluginConstructor(
                regalPlugin
            );
        }

        this._pluginsConstructor = (
            game: GameInstanceInternal,
            options: object
        ) =>
            mapObject<any, any>(
                pluginConstructors,
                (pluginConstructor, pluginKey) => {
                    const optionOverrides = options[pluginKey] || {};
                    return pluginConstructor(game, optionOverrides);
                }
            );
    }

    public static reset(): void {
        this._plugins = [];
        this._isInitialized = false;
    }

    public static getPluginsConstructor(): PluginsConstructor {
        if (!this._isInitialized) {
            throw new RegalError("PluginManager has not been initialized");
        }

        return this._pluginsConstructor;
    }

    public static registerPlugin(plugin: RegalPluginAny): void {
        if (!ContextManager.isContextStatic()) {
            throw new RegalError(
                "Cannot register plugins outside the game's static context."
            );
        }

        const keyCollision = this._plugins.find(
            existing => existing.key === plugin.key
        );

        if (keyCollision) {
            throw new RegalError(
                `Cannot register plugin <${
                    plugin.name
                }> since it shares the same key <${plugin.key}> with plugin <${
                    keyCollision.name
                }>, which has already been registered.`
            );
        }

        this._plugins.push(plugin);
    }

    public static validatePlugin(plugin: RegalPluginAny): void {
        const keyType = typeof plugin.key;
        if (
            keyType !== "string" &&
            keyType !== "symbol" &&
            keyType !== "number"
        ) {
            throw new RegalError(
                `The plugin's key must be a string, number, or symbol. Not type <${keyType}>.`
            );
        } else if (keyType === "string" && plugin.key.length === 0) {
            throw new RegalError(
                "The plugin's key must have a length greater than zero."
            );
        }

        if (
            plugin.version &&
            !RegExp(/^v?\d+\.\d+\.\d+$/).test(plugin.version)
        ) {
            throw new RegalError(
                `The provided version "${
                    plugin.version
                }" is not a valid version string.`
            );
        }
    }

    private static _isInitialized: boolean = false;
    private static _plugins: RegalPluginAny[] = [];
    private static _pluginsConstructor: PluginsConstructor;

    private static _getPluginConstructor(
        plugin: RegalPluginAny
    ): ((args: PluginArgs<InstancePlugin>) => InstancePlugin) {
        const defaultOptions = mapObject(
            plugin.options,
            (entry: PluginOptionSchemaEntry) => entry.defaultValue
        );

        return (args: PluginArgs<InstancePlugin>) =>
            plugin.onConstructApi({
                game: args.game,
                options: { ...defaultOptions, ...args.options }
            });
    }
}
