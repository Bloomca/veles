import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/jsx-runtime.ts", "src/utils/index.ts"],
  format: ["esm", "cjs"],
  sourcemap: false,
  clean: true,
  dts: true,
});
