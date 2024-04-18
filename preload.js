const { TitlebarColor, CustomTitlebar } = require("custom-electron-titlebar");
const { contextBridge, ipcRenderer } = require('electron/renderer')
const path = require("path");


contextBridge.exposeInMainWorld('manager', {
    saveFile: (path, content) => ipcRenderer.invoke("saveFile", {path: path, content: content}),
    saveNewFile: (content) => ipcRenderer.invoke("saveNewFile", {content: content}),
    updateTitle: (name) => window.titlebar.updateTitle(name),
    updateType : (type) => ipcRenderer.invoke("setType", {type : type}),
    updateSaveStatus: (status) => ipcRenderer.invoke("updateSaveStatus", {saved: status}),
    updateFileNameAndPath: (callback) => ipcRenderer.on("updateSaveStatus", (_, args)=> {window.titlebar.updateTitle(args.title); callback(args.title, args.path)}),
    requestSaveAndQuit: (callback) => ipcRenderer.on("requestSaveAndQuit", (_) =>  callback()),
    saveAndQuit: (path, content) => ipcRenderer.invoke("saveAndQuit", {path: path, content: content}),
    saveNewAndQuit: (content) => ipcRenderer.invoke("saveNewAndQuit", {content: content}),
    requestQuit: () => ipcRenderer.invoke("quit")
  })


window.addEventListener('DOMContentLoaded', () => {

    window.titlebar = new CustomTitlebar({
      backgroundColor: TitlebarColor.fromHex("#273C75"),
      icon: path.join(__dirname, 'dist/browser/assets/Logo.png'),
    });
    
  });
