import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { crx } from "@crxjs/vite-plugin";
import defineManifest from "./manifest.config";
import AutoImport from "unplugin-auto-import/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest: defineManifest }),
    AutoImport({
      imports: ["vue", "vue-router", "pinia"],
      dts: "types/auto-imports.d.ts",
      eslintrc: {
        enabled: true,
        filepath: "./.eslintrc-auto-import.cjs",
        globalsPropValue: true
      }
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@popup": fileURLToPath(new URL("./src/pages/popup", import.meta.url)),
      "@side-panel": fileURLToPath(new URL("./src/pages/side-panel/index.html", import.meta.url)),
    }
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        popup: "src/pages/popup/index.html",
        404: "src/pages/404/index.html",
        devtool: "src/pages/devtool/index.html",
      },
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]",
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js"
      }
    }
  }
});
