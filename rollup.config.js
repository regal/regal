import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";

import pkg from "./package.json";

const bundleHeader = `/**
 * Source code for Regal (a.k.a. the Regal Game Library), part of the Regal Framework.
 * 
 * Copyright (c) 2018 Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */`

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
            format: "cjs",
            banner: bundleHeader
        },
        {
            file: pkg.module,
            format: "esm",
            banner: bundleHeader
        },
        {
            file: pkg.browser,
            format: "umd",
            name: "Regal",
            banner: bundleHeader
        }
    ],
    onwarn: supressCircularImportWarnings
}