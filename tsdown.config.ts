import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/jsx-runtime.ts"],
  format: ["esm", "cjs"],
  sourcemap: false,
  clean: true,
  fixedExtension: false,
  dts: true,
});
