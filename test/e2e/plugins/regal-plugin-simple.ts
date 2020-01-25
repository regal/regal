import {
    definePlugin,
    InstancePluginBase,
    GameInstance,
    PluginArgs,
    EventId
} from "../../../dist/src";

interface SimplePluginOptions {
    /** This option */
    optionBool: boolean;
}

export class SimplePlugin extends InstancePluginBase<SimplePluginOptions> {
    recycle: (game: GameInstance<any>) => SimplePlugin;

    revert: (revertTo: EventId, game: GameInstance<any>) => SimplePlugin;

    constructor(args: PluginArgs<SimplePlugin>) {
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
    onConstructApi: (args: PluginArgs<SimplePlugin>) => new SimplePlugin(args)
});
