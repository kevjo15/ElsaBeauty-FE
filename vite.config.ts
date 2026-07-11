import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

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
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "apple-touch-icon.png"],
        manifest: {
          name: "ElsaBeauty",
          short_name: "ElsaBeauty",
          description:
            "Boka medicinsk hudvård och estetiska behandlingar hos ElsaBeauty.",
          lang: "sv",
          theme_color: "#a34a63",
          background_color: "#faf4f1",
          display: "standalone",
          start_url: "/",
          scope: "/",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Bara statiska app-skalet cachas. API-anrop och SAS-bilder går
          // aldrig via service workern (annars riskerar man utgångna SAS/data).
          globPatterns: ["**/*.{js,css,html,svg,woff2}"],
          navigateFallbackDenylist: [/^\/api/, /^\/chatHub/, /^\/notificationHub/],
          cleanupOutdatedCaches: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
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
