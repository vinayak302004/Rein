const { app, BrowserWindow } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const http = require("http")

let mainWindow
let serverProcess

const isDev = !app.isPackaged

const DEV_URL =
	process.env.VITE_DEV_SERVER_URL ||
	"http://localhost:3000"

function waitForServer(url) {
	return new Promise((resolve) => {
		const check = () => {
			http
				.get(url, () => resolve())
				.on("error", () => setTimeout(check, 500))
		}

		check()
	})
}

async function startProductionServer() {
	const serverPath = path.join(
		process.resourcesPath,
		".output",
		"server",
		"index.mjs"
	)

	console.log("Starting production server:", serverPath)

	serverProcess = spawn("node", [serverPath], {
		stdio: "inherit",

		windowsHide: true,

		env: {
			...process.env,
			HOST: "0.0.0.0",
			PORT: "3000",
		},
	})

	await waitForServer("http://localhost:3000")
}

async function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,

		show: true,

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	if (isDev) {
		mainWindow.webContents.openDevTools()
	}

	try {
		if (isDev) {
			console.log("Loading DEV URL:", DEV_URL)

			await waitForServer(DEV_URL)

			await mainWindow.loadURL(DEV_URL)
		} else {
			console.log("Loading PROD URL")

			await startProductionServer()

			await mainWindow.loadURL(
				"http://localhost:3000"
			)
		}

		console.log("WINDOW LOADED")
	} catch (err) {
		console.error("LOAD ERROR:", err)
	}

	mainWindow.on("closed", () => {
		mainWindow = null
	})
}

app.whenReady().then(createWindow)

app.on("window-all-closed", () => {
	if (serverProcess) {
		serverProcess.kill()
	}

	if (process.platform !== "darwin") {
		app.quit()
	}
})