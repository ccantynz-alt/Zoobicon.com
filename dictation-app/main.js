const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 500,
    minHeight: 400,
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0a0a0f',
      symbolColor: '#ffffff',
      height: 40
    },
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Global shortcut: Ctrl+Shift+D to toggle window
  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Global shortcut: F9 to toggle mic from anywhere
  globalShortcut.register('F9', () => {
    mainWindow.webContents.send('toggle-mic');
    if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createTray() {
  // Create a simple 16x16 tray icon using nativeImage
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA' +
    'nklEQVQ4T2NkoBAwUqifgWoGMDIyBjAyMgYSYwgjI+N/BgaG/4yMjAFArADE/w8MDAxA' +
    'MSBmYGRkDADiACDNAMQBQAwUA+oDYqC+ACBmAGIGEA3EQPUBYP1ADYyMjAFA/UBxBiAN' +
    'ogHqgQaA1INsBJkBkgfpI8YLIBuA6oEuYCDWBgYGBkZiXQDUxwAMB2K9AHIB0e4mxQAi' +
    '4gYAHH8gEfx3N+UAAAAASUVORK5CYII='
  );

  tray = new Tray(icon);
  tray.setToolTip('Dictation');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dictation',
      click: () => { mainWindow.show(); mainWindow.focus(); }
    },
    {
      label: 'Toggle Mic (F9)',
      click: () => { mainWindow.webContents.send('toggle-mic'); mainWindow.show(); }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => { isQuitting = true; app.quit(); }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('before-quit', () => {
  isQuitting = true;
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
