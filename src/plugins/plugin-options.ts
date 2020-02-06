import { RegisteredPlugins } from "./instance-plugins";

export interface PluginOptionSchemaEntry<ValueType = any> {
    defaultValue: ValueType;
    description?: string;
    // TODO - implement further
}

export type PluginOptionSchema<Options> = {
    [OptionKey in keyof Options]: PluginOptionSchemaEntry<Options[OptionKey]>
};

export type PluginOptionsOverrides<Plugins extends RegisteredPlugins> = {
    [P in keyof Plugins]: Plugins[P]["options"]
};
