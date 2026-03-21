const { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

let mainWindow;
let tray;
let nextServer;
const PORT = 3847; // Unlikely to conflict

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve();
          } else {
            retry();
          }
        })
        .on("error", retry);
    };
    const retry = () => {
      if (Date.now() - start > timeout) {
        reject(new Error("Server startup timeout"));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    // In development, use next dev. In production (packaged), use next start.
    const isPacked = app.isPackaged;
    const nextBin = path.join(
      isPacked ? process.resourcesPath : __dirname,
      isPacked ? "node_modules/.bin/next" : "../node_modules/.bin/next"
    );
    const cwd = isPacked
      ? process.resourcesPath
      : path.join(__dirname, "..");

    const args = isPacked ? ["start", "-p", String(PORT)] : ["dev", "-p", String(PORT)];

    nextServer = spawn(process.platform === "win32" ? nextBin + ".cmd" : nextBin, args, {
      cwd,
      env: { ...process.env, PORT: String(PORT) },
      stdio: "pipe",
      shell: process.platform === "win32",
    });

    nextServer.stdout.on("data", (data) => {
      console.log(`[next] ${data}`);
    });

    nextServer.stderr.on("data", (data) => {
      console.error(`[next] ${data}`);
    });

    nextServer.on("error", (err) => {
      console.error("Failed to start Next.js server:", err);
      reject(err);
    });

    // Wait for server to be ready
    waitForServer(`http://localhost:${PORT}`)
      .then(resolve)
      .catch(reject);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 600,
    minHeight: 500,
    title: "Dictation",
    backgroundColor: "#0a0a0f",
    titleBarStyle: "hiddenInset",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Frameless on Windows for cleaner look, standard on Mac
    ...(process.platform === "win32"
      ? { frame: true, titleBarOverlay: { color: "#0a0a0f", symbolColor: "#ffffff" } }
      : {}),
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Grant microphone permission automatically
  mainWindow.webContents.session.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (permission === "media") {
        callback(true);
      } else {
        callback(false);
      }
    }
  );

  mainWindow.on("close", (e) => {
    // Minimize to tray instead of closing
    if (tray && !app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple tray icon (16x16 colored square)
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Dictation",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Dictation");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

app.whenReady().then(async () => {
  try {
    console.log("Starting Next.js server...");
    await startNextServer();
    console.log("Next.js server ready");

    createWindow();
    createTray();

    // Global shortcut: F2 to toggle mic (works even when app is not focused)
    globalShortcut.register("F2", () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.executeJavaScript(
          'document.dispatchEvent(new KeyboardEvent("keydown", { key: "F2" }))'
        );
      }
    });
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.isQuitting = true;
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  if (nextServer) {
    nextServer.kill();
  }
});
