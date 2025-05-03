const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const pingManager = require('./pingManager');
const fs = require('fs-extra');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  mainWindow.loadFile('src/index.html');
  
  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('start-ping', async (event, { target, company, duration }) => {
  return await pingManager.startTest(target, company, duration);
});

ipcMain.handle('stop-ping', async () => {
  return await pingManager.stopTest();
});

ipcMain.handle('export-results', async () => {
  return await pingManager.exportResults();
});

// Configuração
ipcMain.handle('get-config', async () => {
  try {
    const config = await fs.readJson('config.json');
    return config;
  } catch (error) {
    // Se o arquivo não existir, retorna configurações padrão
    return {
      apiEndpoint: "http://localhost:3000/api/ping-results",
      defaultPingInterval: 1,
      maxLogFiles: 5,
      logDirectory: "logs"
    };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    await fs.writeJson('config.json', config, { spaces: 2 });
    return { success: true };
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
});

// Navegação
ipcMain.on('navigate-to-main', () => {
  mainWindow.loadFile('src/index.html');
});

ipcMain.on('navigate-to-settings', () => {
  mainWindow.loadFile('src/settings.html');
});

// Add directory selection handler
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
}); 