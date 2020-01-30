import { WithPlugin, registerPlugin, GameInstance } from "../../../dist/src";
import Complex, { ComplexPluginRequiredState } from "./regal-plugin-complex";
import Simple from "./regal-plugin-simple";

registerPlugin(Complex);
registerPlugin(Simple);

interface MyState extends ComplexPluginRequiredState {
    myStateProp: boolean;
}

type MyGameInstance = GameInstance<
    MyState,
    WithPlugin<typeof Complex> & WithPlugin<typeof Simple>
>;

let myGame: MyGameInstance;
const { simple, complex } = myGame.plugins;
