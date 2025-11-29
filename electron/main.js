const { app, BrowserWindow, Menu, session } = require("electron");
const path = require("path");

// Suppress Electron security warnings in development
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// detect dev server URL (set by your dev script)
const isDev = !!process.env.VITE_DEV_SERVER_URL;

// Configure CSP - more secure for production, relaxed for development
const CSP = isDev
  ? [
      "default-src 'self'",
      "connect-src 'self' http://localhost:8000 https://localhost:8000 http://127.0.0.1:8000 https://127.0.0.1:8000 http://localhost:3000 http://192.168.1.2:8000 https://192.168.1.2:5173 http://192.168.1.2:5173 https://192.168.1.2:8000",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "worker-src 'self' blob:",
      "frame-src https://demo.strich.io https://demo.dynamsoft.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
    ].join("; ")
  : [
      "default-src 'self'",
      "connect-src 'self' http://localhost:8000 https://localhost:8000",
      "script-src 'self'",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob:",
      "media-src 'self' blob:",
    ].join("; ");

// Keep a global reference so the window isn't garbage-collected.
let mainWindow = null;

// Ignore certificate errors in development (for self-signed certs)
if (isDev) {
  app.commandLine.appendSwitch("ignore-certificate-errors");
}

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
      webSecurity: false, // Disable web security for dev mode
    },
  });

  // Add console logging for navigation events
  mainWindow.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "Failed to load:",
        validatedURL,
        "Error:",
        errorDescription
      );
    }
  );

  mainWindow.webContents.on("did-finish-load", () => {
    console.log("Page loaded successfully");
  });

  // Open DevTools only in development
  if (isDev) mainWindow.webContents.openDevTools();

  // Load URL in dev or static file in production
  if (isDev) {
    const devURL =
      process.env.VITE_DEV_SERVER_URL || "https://192.168.1.2:5173";
    console.log("Loading dev URL:", devURL);
    mainWindow.loadURL(devURL).catch((err) => {
      console.error("Failed to load dev URL:", err);
      // Fallback to localhost if network URL fails
      mainWindow.loadURL("https://localhost:5173");
    });
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

  // CSP disabled when webSecurity is false - commented out to avoid warnings
  // Set CSP headers
  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       "Content-Security-Policy": [CSP],
  //     },
  //   });
  // });

  // Allow camera and microphone access for QR scanning
  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      if (permission === "camera" || permission === "microphone") {
        callback(true); // Allow camera/microphone access
      } else {
        callback(false); // Deny other permissions
      }
    }
  );

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  // On macOS apps commonly stay open until Cmd+Q
  if (process.platform !== "darwin") app.quit();
});
