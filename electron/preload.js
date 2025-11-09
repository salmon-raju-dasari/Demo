// electron/preload.js
// Use CommonJS require here because Electron preload runs in a
// CommonJS context (unless packaged/transpiled as ESM).
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"), // example
});
contextBridge.exposeInMainWorld("isElectron", true);
