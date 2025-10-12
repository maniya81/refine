import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/refine/" : "/",
  plugins: [tsconfigPaths({ root: __dirname }), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ["antd"],
        },
      },
    },
  },
});
