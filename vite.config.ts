import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.webp"],
            manifest: {
                name: "Tonality",
                short_name: "Tonality",
                description: "Web site for determining tones",
                start_url: "./",
                scope: "./",
                display: "standalone",
                theme_color: "#101418",
                background_color: "#101418",
                icons: [
                    { src: "favicon.webp", sizes: "192x192", type: "image/webp" },
                    { src: "favicon.webp", sizes: "512x512", type: "image/webp" },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,mp3}"],
                maximumFileSizeToCacheInBytes: 2_000_000,
            },
        }),
    ],
    test: {
        environment: "jsdom",
        setupFiles: "./src/setupTests.ts",
        clearMocks: true,
    },
});
