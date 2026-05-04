import { defineConfig } from "vitest/config";
import path from "path";

// lru-cache 10.x ships its main entry as TypeScript source via the `exports`
// field. jsdom's css-color helper does a legacy CJS resolve that ignores the
// exports map and looks for a top-level index.js, which fails. Pinning the
// alias to the package's commonjs build sidesteps the resolution mismatch
// without us needing to downgrade the dep.
const lruCacheCjs = path.resolve(__dirname, "./node_modules/lru-cache/dist/commonjs/index.js");

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: [],
    server: {
      deps: {
        // Ensure the alias below is honoured even when the dep is required
        // from inside another node_modules package (e.g. @asamuzakjp/css-color).
        inline: ["lru-cache"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "lru-cache": lruCacheCjs,
    },
  },
});
