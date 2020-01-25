import { InstancePlugins, WithPlugin, registerPlugin } from "../../../dist/src";
import Complex from "./regal-plugin-complex";
import Simple from "./regal-plugin-simple";

registerPlugin(Complex);
registerPlugin(Simple);

let ip: InstancePlugins<WithPlugin<typeof Complex> & WithPlugin<typeof Simple>>;
