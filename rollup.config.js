import typescript from "rollup-plugin-typescript2";
import resolve from "rollup-plugin-node-resolve";
import cleanup from "rollup-plugin-cleanup";
import { terser } from "rollup-plugin-terser";
import json from "rollup-plugin-json";

import pkg from "./package.json";

const banner = `/**
 * Source code for Regal (a.k.a. the Regal Game Library), part of the Regal Framework.
 * 
 * Copyright (c) Joseph R Cowman
 * Licensed under MIT License (see https://github.com/regal/regal)
 */`

const supressCircularImportWarnings = (message, defaultFunc) => {
    if (message.code === "CIRCULAR_DEPENDENCY") {
        return;
    }
    defaultFunc(message);
}

const tsPlugin = typescript({
    tsconfigOverride: {
        compilerOptions: { module: "ES2015" }
    }
});

export default [
    {
        input: "./src/index.ts",
        output: [
            { file: pkg.main, format: "cjs", banner },
            { file: pkg.module, format: "esm", banner }
        ],
        plugins: [
            json({ include: "package.json" }),
            tsPlugin,
            resolve(),
            cleanup({
                extensions: [".js", ".ts"],
                comments: /^((?!(Joseph R Cowman)|tslint)[\s\S])*$/, // Removes file-header comments and tslint comments
                maxEmptyLines: 0
            }),
        ],
        onwarn: supressCircularImportWarnings,
        external: Object.keys(pkg.dependencies) // Exclude package.json dependencies from cjs and esm bundles
    },
    {
        input: "./src/index.ts",
        output: { file: pkg.browser, format: "umd", name: "Regal" },
        plugins: [
            json({ include: "package.json" }),
            tsPlugin,
            resolve(),
            terser({
                output: { comments: false, preamble: banner }
            })
        ],
        onwarn: supressCircularImportWarnings
    }
]