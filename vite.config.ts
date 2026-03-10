import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function resolveProxyTarget(apiBaseUrl: string | undefined, localProxyTarget: string | undefined): string {
  if (localProxyTarget) {
    return localProxyTarget;
  }

  if (apiBaseUrl?.startsWith("http://") || apiBaseUrl?.startsWith("https://")) {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      // Fall back below
    }
  }

  // Used only when running vite dev server without env vars.
  return "http://localhost:5011";
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files for the active mode, including non-VITE vars for config usage.
  const env = loadEnv(mode, process.cwd(), "");

  const proxyTarget = resolveProxyTarget(
    env.VITE_API_BASE_URL,
    env.VITE_LOCAL_API_PROXY_TARGET
  );

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/chatHub": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
        "/notificationHub": {
          target: proxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
