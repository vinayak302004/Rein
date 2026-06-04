import { URL, fileURLToPath } from "node:url"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { nitro } from "nitro/vite"
import { defineConfig } from "vite"
import serverConfig from "./src/server-config.json"

const config = defineConfig(({ command }) => ({
	base: "/",

	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},

	plugins: [
		devtools(),

		nitro(),

		tanstackStart(),

		viteReact({
			reactCompiler: true,
		}),

		// ONLY RUN WS SERVER IN DEV
		command === "serve"
			? {
					name: "websocket-server",

					async configureServer(server) {
						const { createWsServer } = await import(
							"./src/server/websocket"
						)

						const httpServer = server.httpServer

						if (!httpServer) return

						await createWsServer(httpServer)
					},
				}
			: null,
	].filter(Boolean),

	server: {
		host:
			serverConfig.host === "0.0.0.0"
				? true
				: serverConfig.host,

		port: serverConfig.frontendPort,
	},
}))

export default config