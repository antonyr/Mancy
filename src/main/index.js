require('crash-reporter').start();
var app = require('app');
var path = require('path');
var electron = require('electron');
var BrowserWindow = electron.BrowserWindow;
var {MenuManager} = require('./MenuManager');
var Config = require('../package.json');
var _ = require('lodash');
var ipc = electron.ipcMain;
var fs = require('fs');
var dialog = require('dialog');

var windowCache = {};
var dockNotificationCache = {};
var menuManagerCache = {};
var windowCount = 0;

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('browser-window-blur', function(event, window) {
  window.$focus = false;
});

app.on('browser-window-focus', function(event, window) {
  window.$focus = true;
  dockNotificationCache[window.id] = 0;
  if (process.platform === 'darwin') {
    app.dock.setBadge('');
  }
});

app.on('ready', onReady);
app.on('activate', onReady);

ipc.on('application:message-box', function(event, options) {
  dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
});

ipc.on('application:download', function(event, buffer) {
  let filename = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
    title: 'Download to File…',
    filters: [
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if(filename) {
    fs.writeFile(filename, buffer, (err) => {
      let options = { buttons: ['Close'] };
      if(err) {
        options = _.extend(options, {
          title: 'Download Error',
          type: 'error',
          message: err.name || 'Export Error',
          detail: err.toString()
        });
      } else {
        options = _.extend(options, {
          title: 'Download Success',
          type: 'info',
          message: `Saved to ${filename}`
        });
      }
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), options);
    });
  }
});

ipc.on('application:dock-message-notification', function(event, id) {
  dockNotificationCache[id] = dockNotificationCache[id] + 1;
  if (process.platform === 'darwin') {
    app.dock.setBadge(`${dockNotificationCache[id]}`);
    app.dock.bounce();
  }
});

function onReady() {
  var {width, height} = require('screen').getPrimaryDisplay().workAreaSize;
  var options = {
    width: width * 0.75,
    height: height * 0.75,
    minHeight: height * 0.5,
    minWidth: width * 0.5,
    resizable: true,
    webPreferences: {
			overlayScrollbars: true,
      plugins: true,
      experimentalFeatures: true,
      experimentalCanvasFeatures: true,
      webgl: true
		},
    show: false,
  }
  if(process.platform === 'linux') {
    options.icon = path.resolve(__dirname, '..', 'icons', 'mancy.png');
  }
  let mainWindow = new BrowserWindow(options);

  windowCache[mainWindow.id] = mainWindow;
  let menuManager = menuManagerCache[mainWindow.id] = new MenuManager();

  mainWindow.loadURL('file://' + __dirname + '/../index.html');
  mainWindow.flashFrame(true);
  mainWindow.setTitle(`${_.capitalize(Config.name)} - REPL(${windowCount})`);
  windowCount += 1;

  mainWindow.on('closed', function() {
    delete windowCache[mainWindow.id];
    delete menuManagerCache[mainWindow.id];
  });

  mainWindow.webContents.on('did-finish-load', function() {
    let totalActiveWindows = _.keys(windowCache).length;
    if(totalActiveWindows > 1) {
      let fixPos = (axis, adj) => {
        let naxis = axis + adj;
        return naxis <= 0 ? axis : naxis;
      };
      let [x,y] = mainWindow.getPosition();
      let adj = parseInt(Math.random() * 50) * (Math.random() > 0.3 ? -1: 1);
      let [nx, ny] = [fixPos(x, adj), fixPos(y, adj)];
      mainWindow.setPosition(nx, ny);
    }
    mainWindow.show();
    mainWindow.focus();
    // Mac only
    if (process.platform === 'darwin') {
      mainWindow.showDefinitionForSelection(true);
      //mainWindow.setVisibleOnAllWorkspaces(true);
    }
  });

  menuManager.attachToWindow();
}
