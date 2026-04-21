const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let nextProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public/logo.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });

  setTimeout(() => {
    win.loadURL('http://localhost:3000');
  }, 5000);
}

app.whenReady().then(() => {
  nextProcess = spawn('npm', ['run', 'start'], { shell: true });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (nextProcess) nextProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});