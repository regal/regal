import {
    definePlugin,
    InstancePluginBase,
    PluginArgs,
    EventId
} from "../../../dist/src";

interface SimplePluginOptions {
    /** This option */
    optionBool: boolean;
}

export class SimplePlugin extends InstancePluginBase<SimplePluginOptions> {
    recycle: (args: PluginArgs<SimplePluginOptions>) => SimplePlugin;

    revert: (revertTo: EventId, args: PluginArgs) => SimplePlugin;

    constructor(args: PluginArgs<SimplePluginOptions>) {
        super(args);
    }

    /** My simple prop */
    simpleProp = "hi";
    simpleMethod = (foo: boolean) => this.simpleProp;
}

export default definePlugin({
    name: "Test Simple Plugin",
    key: "simple",
    options: {
        optionBool: {
            defaultValue: false,
            description: "hi"
        }
    },
    onConstructApi: (args: PluginArgs<SimplePluginOptions>) =>
        new SimplePlugin(args)
});
