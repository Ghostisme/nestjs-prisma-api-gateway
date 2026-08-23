import tailwindcss from "@tailwindcss/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const base = env.VITE_APP_PUBLIC_PATH || "/";
	const isProduction = mode === "production";

	return {
		base,
		plugins: [
			react(),
			vanillaExtractPlugin({
				identifiers: ({ debugId }) => `${debugId}`,
			}),
			tailwindcss(),
			tsconfigPaths(),

			isProduction &&
				visualizer({
					open: true,
					gzipSize: true,
					brotliSize: true,
					template: "treemap",
				}),
		].filter(Boolean),

		server: {
			open: true,
			host: true,
			port: 3001,
			proxy: {
				"/api/lumax": {
					target: env.VITE_LUMAX_BFF_URL || "http://localhost:9008",
					changeOrigin: true,
					secure: false,
				},
				"/api/material": {
					target: env.VITE_API_BASE_URL || "http://localhost:3001",
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api\/material/, "/material"),
				},
				"/api/system": {
					target: env.VITE_API_BASE_URL || "http://localhost:3001",
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api\/system/, "/system"),
				},
				"/api": {
					target: env.VITE_API_BASE_URL || "http://localhost:3001",
					changeOrigin: true,
					secure: false,
					rewrite: (path) => path.replace(/^\/api/, ""),
				},
			},
		},

		build: {
			target: "esnext",
			minify: "esbuild",
			sourcemap: !isProduction,
			cssCodeSplit: true,
			chunkSizeWarningLimit: 1500,
			rollupOptions: {
				output: {
					manualChunks: {
						"vendor-core": ["react", "react-dom", "react-router"],
						"vendor-ui": ["antd", "@ant-design/cssinjs", "styled-components"],
						"vendor-utils": ["axios", "dayjs", "zustand", "@iconify/react"],
						"vendor-charts": ["apexcharts", "react-apexcharts"],
					},
				},
			},
		},

		optimizeDeps: {
			include: ["react", "react-dom", "react-router", "antd", "axios", "dayjs"],
			exclude: ["@iconify/react"],
		},

		esbuild: {
			drop: isProduction ? ["console", "debugger"] : [],
			legalComments: "none",
			target: "esnext",
		},
	};
});
