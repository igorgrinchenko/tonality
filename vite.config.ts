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
                theme_color: "#11121c",
                background_color: "#11121c",
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
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "vendor-react",
                            test: /node_modules[\\/](?:react(?:-dom|-router|-redux)?|scheduler|redux|@reduxjs|immer|reselect|use-sync-external-store)[\\/]/,
                            priority: 40,
                        },
                        {
                            name: "vendor-firebase-core",
                            test: /node_modules[\\/](?:@firebase[\\/](?:app|component|logger|util)|firebase[\\/]app)[\\/]/,
                            priority: 30,
                        },
                        {
                            name: "vendor-firebase-auth",
                            test: /node_modules[\\/](?:@firebase|firebase)[\\/]auth[\\/]/,
                            priority: 20,
                        },
                        {
                            name: "vendor-firestore",
                            test: /node_modules[\\/](?:@firebase|firebase)[\\/]firestore[\\/]/,
                            priority: 20,
                        },
                        {
                            name: "vendor-mui",
                            test: /node_modules[\\/](?:@mui|@emotion|@popperjs)[\\/]/,
                            priority: 10,
                        },
                    ],
                },
            },
        },
    },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.{ts,tsx}"],
        setupFiles: "./tests/setupTests.ts",
        clearMocks: true,
    },
});
