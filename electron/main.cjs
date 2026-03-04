const { app, BrowserWindow } = require("electron")
const path = require("path")
const { spawn } = require("child_process")
const http = require("http")
const os = require("os")

let mainWindow
let serverProcess

// Prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// Get actual local IPv4 address
function getLocalIP() {
  const interfaces = os.networkInterfaces()

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address
      }
    }
  }

  return "127.0.0.1"
}

// Wait until server responds
function waitForServer(url, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, () => {
          console.log("✅ Server ready")
          resolve()
        })
        .on("error", () => {
          if (retries > 0) {
            console.log("⏳ Waiting for server...")
            retries--
            setTimeout(check, 1000)
          } else {
            reject(new Error("Server failed to start"))
          }
        })
    }
    check()
  })
}

// Start Nitro server
function startServer() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged

    const serverPath = isDev
      ? path.join(__dirname, "../.output/server/index.mjs")
      : path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          ".output",
          "server",
          "index.mjs"
        )

    console.log("🚀 Starting server from:", serverPath)

    serverProcess = spawn("node", [serverPath], {
      windowsHide: true,
      env: {
        ...process.env,
        HOST: "0.0.0.0",
        PORT: "3000",
      },
    })

    serverProcess.stdout?.on("data", (data) => {
      console.log("SERVER:", data.toString())
    })

    serverProcess.stderr?.on("data", (data) => {
      console.error("SERVER ERROR:", data.toString())
    })

    serverProcess.on("error", reject)

    const ip = getLocalIP()
    waitForServer(`http://${ip}:3000`)
      .then(resolve)
      .catch(reject)
  })
}

// Create Electron window
function createWindow() {
  if (mainWindow) return

  const ip = getLocalIP()
  const url = `http://${ip}:3000`

  console.log("🌍 Loading:", url)

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
  })

  mainWindow.loadURL(url)

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.webContents.on("did-fail-load", (e, code, desc) => {
    console.error("LOAD FAILED:", code, desc)
  })
}

// App startup
app.whenReady().then(async () => {
  try {
    await startServer()
    createWindow()
  } catch (err) {
    console.error("❌ Failed to start app:", err)
  }
})

// Cleanup
app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== "darwin") app.quit()
})