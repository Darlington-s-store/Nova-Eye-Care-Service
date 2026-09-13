import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAdmin = mode === "admin" || process.env.VITE_APP_TARGET === "admin";

  const adminRenamePlugin: Plugin = {
    name: "admin-rename-html",
    closeBundle() {
      if (isAdmin) {
        const outDir = path.resolve(__dirname, "dist-admin");
        const adminHtmlPath = path.join(outDir, "admin.html");
        const indexHtmlPath = path.join(outDir, "index.html");
        if (fs.existsSync(adminHtmlPath)) {
          fs.copyFileSync(adminHtmlPath, indexHtmlPath);
        }
      }
    },
  };

  return {
    server: {
      host: "::",
      port: isAdmin ? 8081 : 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), adminRenamePlugin],
    build: {
      outDir: isAdmin ? "dist-admin" : "dist",
      rollupOptions: {
        input: isAdmin
          ? path.resolve(__dirname, "admin.html")
          : path.resolve(__dirname, "index.html"),
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
  };
});
