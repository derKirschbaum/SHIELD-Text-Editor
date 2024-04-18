const { setupTitlebar, attachTitlebarToWindow  } = require("custom-electron-titlebar/main");
const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");
const url = require("url");
const fs = require('fs')
const path = require("path");

let mainWindow;

let saved = false;
let type = "";

let asked = false;

setupTitlebar();

function saveFile(path, content){
  fs.writeFile(path, content, ()=> {
    console.log("Write to disk success");
  });
}

function saveNewFile(content) {
  let savePath = dialog.showSaveDialogSync(mainWindow);
  
  if(savePath){
    let fileName = path.basename(savePath);
    fs.writeFile(savePath, content, ()=> {
      console.log("Write to disk success");
      mainWindow.webContents.send("updateSaveStatus", {title: fileName, path: savePath});
    });
  } else {
    asked = false;
  }
}

function saveFileAndClose(path, content){
  fs.writeFile(path, content, ()=> {
    console.log("Write to disk success");
    app.quit();
  });
}

function saveNewFileAndClose(content) {
  let savePath = dialog.showSaveDialogSync(mainWindow);
  
  if(savePath){
    fs.writeFile(savePath, content, ()=> {
      console.log("Write to disk success");
      app.quit();
    });
  } else {
    asked = false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hidden',
    titleBarOverlay: true,
    webPreferences: {
      nodeIntegration: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'dist/browser/assets/Logo.png'),
  });

  Menu.setApplicationMenu(null)

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, `/dist/browser/index.html`),
      protocol: "file:",
      slashes: true,
    })
  );
  
  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  attachTitlebarToWindow(mainWindow);

  mainWindow.on("close", (event)=> {

    if (!saved && type === "new" && !asked) {
      event.preventDefault();
      asked = true;
      let response = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        title: "Save file?",
        detail: "Your file is not saved, save now?",
        buttons: ["Yes", "No"],
        cancelId: 3
      });

      switch (response){
        case 0: {
          mainWindow.webContents.send("requestSaveAndQuit");
          break;
        }
        case 1: {
            // User don't want to save
            app.quit();
            break;
        }
        case 3: {
          //User cancel
          asked = false;
        }
      }
    } else if (!saved && type === "open" && !asked) {
      event.preventDefault();
      asked = true;
      let response = dialog.showMessageBoxSync(mainWindow, {
        type: "question",
        title: "Save file?",
        detail: "Your file is not saved, save now?",
        buttons: ["Yes", "No"],
        cancelId: 3
      });

      switch (response){
        case 0: {
          mainWindow.webContents.send("requestSaveAndQuit");
          break;
        }
        case 1: {
            // User don't want to save
            app.quit();
            break;
        }
        case 3: {
          //User cancel
          asked = false;
        }
      }
    } 

  });
}


app.on("ready", ()=> {
  ipcMain.handle("saveFile", (_, args)=> saveFile(args.path, args.content));

  ipcMain.handle("updateSaveStatus", (_, args)=> saved = args.saved);
  ipcMain.handle("setType", (_, args) => type = args.type);
  ipcMain.handle('saveNewFile', (_, args) => saveNewFile(args.content));

  ipcMain.handle("saveAndQuit", (_, args) => saveFileAndClose(args.path, args.content));
  ipcMain.handle("saveNewAndQuit", (_, args) => saveNewFileAndClose(args.content));
  ipcMain.handle("quit", ()=> app.quit());

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
