import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";

import pkg from "./package.json";

const supressCircularImportWarnings = (message, defaultFunc) => {
    if (message.code === "CIRCULAR_DEPENDENCY") {
        return;
    }
    defaultFunc(message);
}

export default {
    input: "./src/index.ts",
    plugins: [
        typescript({
            tsconfigOverride: {
                compilerOptions: {
                    module: "ES2015"
                }
            }
        }),
        resolve()
    ],
    output: [
        {
            file: pkg.main,
            format: "cjs"
        },
        {
            file: pkg.module,
            format: "esm"
        },
        {
            file: pkg.browser,
            format: "umd",
            name: "Regal"
        }
    ],
    onwarn: supressCircularImportWarnings
}