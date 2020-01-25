import {
    definePlugin,
    InstancePluginBase,
    GameInstance,
    InstancePlugin,
    PluginArgs,
    EventId
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
    optionEnum: MyEnum;
}

type ComplexPluginGameInstance = GameInstance<ComplexPluginRequiredState>;

export class ComplexPlugin extends InstancePluginBase<
    ComplexPluginOptions,
    ComplexPluginGameInstance
> {
    recycle: (game: ComplexPluginGameInstance) => ComplexPlugin;

    revert: (
        revertTo: EventId,
        game: ComplexPluginGameInstance
    ) => ComplexPlugin;

    constructor(args: PluginArgs<ComplexPlugin>) {
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
    onConstructApi: (args: PluginArgs<ComplexPlugin>) => new ComplexPlugin(args)
});
