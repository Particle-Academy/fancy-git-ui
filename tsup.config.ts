import { defineConfig } from "tsup";
export default defineConfig({entry:{index:"src/index.ts",styles:"src/styles.css"},format:["esm","cjs"],dts:true,clean:true,sourcemap:true,external:["react","react-dom","@particle-academy/fancy-git"],loader:{".css":"css"}});
