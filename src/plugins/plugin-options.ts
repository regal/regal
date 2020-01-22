export type PluginOptionSchema<Options> = {
    [OptionKey in keyof Options]: {
        defaultValue: Options[OptionKey];
        description?: string;
        // TODO - implement further
    }
};
