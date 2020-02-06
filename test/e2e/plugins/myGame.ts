import {
    WithPlugin,
    registerPlugin,
    GameInstance,
    GameMetadata
} from "../../../dist/src";
import Complex, { ComplexPluginRequiredState } from "./regal-plugin-complex";
import Simple from "./regal-plugin-simple";

registerPlugin(Complex);
registerPlugin(Simple);

interface MyState extends ComplexPluginRequiredState {
    myStateProp: boolean;
}

type MyGamePlugins = WithPlugin<typeof Complex> & WithPlugin<typeof Simple>;
type MyGameInstance = GameInstance<MyState, MyGamePlugins>;

let myGame: MyGameInstance;
const { simple, complex } = myGame.plugins;

let metadata: GameMetadata<MyGamePlugins>;
