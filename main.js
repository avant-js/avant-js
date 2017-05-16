const electron = require('electron');
// Module to control application life.
const eapp = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 1024, height: 800})

  setTimeout(function() {win.loadURL('http://127.0.0.1:1880/')}, 1000);


  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your eapp supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
eapp.on('ready', function() {
    require('./red.js')(createWindow);
})

// Quit when all windows are closed.
eapp.on('window-all-closed', () => {
  // On macOS it is common for eapplications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    eapp.quit();
    //RED.stop();
    // TODO: need to allow nodes to close asynchronously before terminating the
    // process - ie, promises
    process.exit();
  }
})

eapp.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    require('./red.js')(createWindow);
  }
})

require('./red.js')(function(){
    console.log('comecou')
})