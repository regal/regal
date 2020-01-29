import {
    definePlugin,
    InstancePluginBase,
    GameInstance,
    PluginArgs,
    EventId,
    InstancePlugin
} from "../../../dist/src";

enum MyEnum {
    Foo = 1,
    Bar = 2
}

interface ComplexPluginRequiredState {
    complexStateProp: string;
}

interface ComplexPluginOptions {
    optionStr: string;
    /** option enum `woo` */
    optionEnum: MyEnum;
}

type ComplexPluginGameInstance = GameInstance<ComplexPluginRequiredState>;

export class ComplexPlugin extends InstancePluginBase<
    ComplexPluginOptions,
    ComplexPluginGameInstance
> {
    recycle: (args: PluginArgs<ComplexPluginOptions>) => ComplexPlugin;

    revert: (
        revertTo: EventId,
        args: PluginArgs<ComplexPluginOptions>
    ) => ComplexPlugin;

    constructor(args: PluginArgs<ComplexPluginOptions>) {
        super(args);
        this.game.state.complexStateProp = "bar";
    }

    complexProp = 1;
    /** My complex method */
    complexMethod = (foo: string) => foo;
}

export default definePlugin({
    name: "Test Complex Plugin",
    key: "complex",
    options: {
        optionStr: {
            defaultValue: "test"
        },
        optionEnum: {
            defaultValue: MyEnum.Bar
        }
    },
    onConstructApi: (args: PluginArgs<ComplexPluginOptions>) =>
        new ComplexPlugin(args)
});
