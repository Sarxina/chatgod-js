import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

// Tests live next to source as `*.test.ts` under src/. The React client in
// src/client/ has its own build pipeline and is excluded from the
// server-side test suite.
//
// We use SWC for the test transform because the codebase relies on TC39
// stage-3 decorators (`@updateGodState`, `@updateFromFrontend`); vitest's
// default esbuild transform mis-handles them at the time of this writing.
export default defineConfig({
    // Vite 7+ uses Oxc for default JS/TS transformation; disable it so SWC's
    // plugin (below) is the sole transform path. Without this, both run.
    oxc: false,
    plugins: [
        swc.vite({
            jsc: {
                target: "es2022",
                parser: {
                    syntax: "typescript",
                    decorators: true,
                },
                transform: {
                    // TC39 stage-3 decorators (TS 5.x default), not legacy
                    // experimental decorators. SWC's default is the legacy
                    // shape, so we have to opt in explicitly.
                    decoratorVersion: "2022-03",
                },
            },
        }),
    ],
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["**/node_modules/**", "src/client/**"],
        environment: "node",
    },
});
