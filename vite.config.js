import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "SwipeWise Admin",
        short_name: "SwipeWise",
        description:
          "SwipeWise content admin — upload, generate, review and publish swipe cards.",
        theme_color: "#0EA5E9",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Main bundle (xlsx) is large — lift the 2 MB default cap.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      // Keep the service worker out of `npm run dev` to avoid caching surprises.
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5174,
    // Forward /api to vercel dev when using `npm run dev` (run `vercel dev` in another terminal).
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
