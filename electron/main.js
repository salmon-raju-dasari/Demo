const { app, BrowserWindow, Menu, session } = require("electron");
const path = require("path");

// detect dev server URL (set by your dev script)
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// Configure CSP
const CSP = [
  "default-src 'self'",
  "connect-src 'self' http://localhost:8000 http://localhost:3000 ws://localhost:*",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "font-src 'self' data:",
  "img-src 'self' data:",
].join("; ");

// Keep a global reference so the window isn't garbage-collected.
let mainWindow = null;

function createWindow() {
  // Prevent creating multiple windows if createWindow called twice.
  if (mainWindow) return;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // Security: disable nodeIntegration in renderer and enable context isolation
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  // Open DevTools only in development
  if (isDev) mainWindow.webContents.openDevTools();

  // Load URL in dev or static file in production
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexFile = path.join(__dirname, "..", "dist", "index.html");
    console.log("Loading index file:", indexFile);
    mainWindow.loadFile(indexFile).catch((err) => {
      console.error("Failed to load index.html:", err);
    });
  }

  // Clean up reference when window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// App lifecycle: single, canonical set of handlers
app.whenReady().then(() => {
  // Remove the default application menu so File/View/Window menus are not shown
  // try {
  // Menu.setApplicationMenu(null);
  // } catch (e) {
  // ignore if Menu is not available for some platforms/environments
  // console.warn("Unable to clear application menu:", e && e.message);
  // }

  // Set CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [CSP],
      },
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // On macOS apps commonly stay open until Cmd+Q
  if (process.platform !== "darwin") app.quit();
});
