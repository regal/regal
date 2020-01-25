import { InstancePlugins, WithPlugin, registerPlugin } from "../../../dist/src";
import Complex from "./regal-plugin-complex";
import Simple from "./regal-plugin-simple";

const complexPlugin = registerPlugin(Complex);
const simplePlugin = registerPlugin(Simple);

let ip: InstancePlugins<typeof complexPlugin & typeof simplePlugin>;

// registerPlugin(Complex);
// registerPlugin(Simple);

// let ip: InstancePlugins<WithPlugin<typeof Complex> & WithPlugin<typeof Simple>>;
