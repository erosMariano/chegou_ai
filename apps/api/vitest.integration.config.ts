import { resolve } from "path"
import swc from "unplugin-swc"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    environment: "node",
    include: ["test/integration/**/*.int-spec.ts"],
    setupFiles: ["./test/setup-integration.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: "forks",
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
    }),
  ],
})

