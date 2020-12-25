const {app, BrowserWindow, ipcMain} = require('electron');
const {autoUpdater} = require("electron-updater");

const path = require('path');
const url = require('url');

let pluginName;
let pluginVersion;
let mainWindow;

switch (process.platform) {
    case 'win32':
        if (process.arch === "x32" || process.arch === "ia32") {
            pluginName = 'pepflashplayer-32.dll';
            pluginVersion = '32.0.0.465';
        } else {
            pluginName = 'pepflashplayer.dll';
            pluginVersion = '20.0.0.306';
        }
        break;
    case 'darwin':
        pluginName = 'PepperFlashPlayer.plugin';
        pluginVersion = '32.0.0.207';
        break;
    case "linux":
    case "freebsd":
    case "netbsd":
    case "openbsd":
        pluginName = 'libpepflashplayer.so';
        pluginVersion = '32.0.0.207';
        break;
}
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch('high-dpi-support', "1");
app.commandLine.appendSwitch('force-device-scale-factor', "1");

app.commandLine.appendSwitch('ppapi-flash-path', path.join(__dirname.includes(".asar") ? process.resourcesPath : __dirname, "flash/" + pluginName));
let sendWindow = (identifier, message) => {
    mainWindow.webContents.send(identifier, message);
};
let createWindow = async () => {
    mainWindow = new BrowserWindow({
        title: "HabboCity",
        icon: path.join(__dirname, '/icon.ico'),
        webPreferences: {
            plugins: true,
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true,
            webSecurity: false
        },
        show: false,
        backgroundColor: "#000",
    });
    mainWindow.maximize();
    mainWindow.show();
    mainWindow.setMenu(null);

   // await mainWindow.loadURL("https://habbocity.me");
    await mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, `app.html`),
        protocol: 'file:',
        slashes: true
    }));

    sendWindow("version", app.getVersion());
   // mainWindow.webContents.openDevTools();
    ipcMain.on('clearcache', async () => {
        let session = mainWindow.webContents.session;
        await session.clearCache();
        app.relaunch();
        app.exit();
    });


    ipcMain.on('fullscreen', () => {
        if (mainWindow.isFullScreen())
            mainWindow.setFullScreen(false);
        else
            mainWindow.setFullScreen(true);

    });
    ipcMain.on('zoomOut', () => {
        let factor = mainWindow.webContents.getZoomFactor();
        if (factor > 0.3) {
            mainWindow.webContents.setZoomFactor(factor - 0.01);
        }
    });
    ipcMain.on('zoomIn', () => {
        let factor = mainWindow.webContents.getZoomFactor();
        if (factor < 3) {
            mainWindow.webContents.setZoomFactor(factor + 0.01);
        }
    });
};

app.on('ready', async () => {
    await createWindow();
    await autoUpdater.checkForUpdatesAndNotify();
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', async () => {
    if (mainWindow === null) {
        await createWindow();
    }
});

autoUpdater.on('checking-for-update', () => {
    sendWindow('checking-for-update', '');
});
autoUpdater.on('update-available', () => {
    sendWindow('update-available', '');
});
autoUpdater.on('update-not-available', () => {
    sendWindow('update-not-available', '');
});
autoUpdater.on('error', (err) => {
    sendWindow('error', 'Error: ' + err);
});
autoUpdater.on('download-progress', (d) => {
    sendWindow('download-progress', {
        speed: d.bytesPerSecond,
        percent: d.percent,
        transferred: d.transferred,
        total: d.total
    });
});
autoUpdater.on('update-downloaded', () => {
    sendWindow('update-downloaded', 'Update downloaded');
    autoUpdater.quitAndInstall();
});