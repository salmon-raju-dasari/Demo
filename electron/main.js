const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

// detect dev server URL (set by your dev script)
const isDev = !!process.env.VITE_DEV_SERVER_URL

// Keep a global reference so the window isn't garbage-collected.
let mainWindow = null

function createWindow() {
  // Prevent creating multiple windows if createWindow called twice.
  if (mainWindow) return

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Security: disable nodeIntegration in renderer and enable context isolation
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  })

  // Open DevTools only in development
  if (isDev) mainWindow.webContents.openDevTools()

  // Load URL in dev or static file in production
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const indexFile = path.join(__dirname, '..', 'dist', 'index.html')
    console.log('Loading index file:', indexFile)
    mainWindow.loadFile(indexFile).catch(err => {
      console.error('Failed to load index.html:', err)
    })
  }

  // Clean up reference when window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle: single, canonical set of handlers
app.whenReady().then(() => {
  // Remove the default application menu so File/View/Window menus are not shown
  try {
    Menu.setApplicationMenu(null)
  } catch (e) {
    // ignore if Menu is not available for some platforms/environments
    console.warn('Unable to clear application menu:', e && e.message)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // On macOS apps commonly stay open until Cmd+Q
  if (process.platform !== 'darwin') app.quit()
})
