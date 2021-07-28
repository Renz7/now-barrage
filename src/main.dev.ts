/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build:main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, Cookie, ipcMain, Notification, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';

import { getAllCookies, saveCookie } from './core/storage';
import { getUid } from './core/encrypt';
import Apis from './core/apis';
import Resp, { LoginData } from './core/interfaces';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify().then();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`).then();

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow().then();
});

ipcMain.on('login', (_, args) => {
  switch (args) {
    case 'qq':
      console.log('login from qq');
      if (mainWindow) {
        let win = new BrowserWindow({
          parent: mainWindow,
          modal: true,
          show: false
        });
        win.loadURL('https://graph.qq.com/oauth2.0/show?which=Login&display=pc&response_type=code&client_id=101490787&redirect_uri=https%3A%2F%2Fnow.qq.com%2Fcgi-bin%2Fnow%2Fweb%2Fuser%2Fqq_open_auth%3Fappid%3D101490787%26url%3Dhttps%253A%252F%252Fnow.qq.com%252Fpcweb%252F%26redirect_url%3Dhttps%253A%252F%252Fnow.qq.com%252Fpcweb%252Findex.html',
          {
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }).then();
        win.once('close', () => {
          win.webContents.session.cookies.get({
            domain: '.qq.com'
          }).then((cookies) => {
            new Apis(cookies).login().then((data: Resp<LoginData>) => {
                if (data.result) {
                  let explicitUid = data.result.info.explicit_uid;
                  let type = String(data.result.info.user_type);
                  let logoUrl = data.result.info.user_logo_url;
                  let nickName = data.result.info.user_nick;
                  console.log(nickName);
                  saveCookie(getUid(cookies), explicitUid, cookies, type, logoUrl).then();
                }
              }
            );
          }).catch((error) => {
            console.error(error);
          });
        });
        win.show();
      }
      return;
    default:
      console.log('login not supported');
      return;
  }
});


ipcMain.on('accounts', ev => {
  getAllCookies().then((data: any) => {
    ev.reply('accounts-reply', JSON.stringify(data));
  });
});


ipcMain.on('barrage', (_, args: {
  roomId: number,
  barrage: string
}) => {
  console.log('send msg %s', args);
  getAllCookies().then(async (data) => {
    let ps = [];
    for (const row of data) {
      if (row.cookies != null) {
        let cookies: Cookie[] = JSON.parse(row.cookies);
        let apis = new Apis(cookies);
        let anchorId = 0;
        await apis.getRoomInfo(args.roomId, data => {
          return data;
        }).then(data =>
          anchorId = data.result.explicit_uid
        ).catch(() => {
          return;
        });
        if (anchorId <= 0) continue;
        await apis.followAnchor(anchorId).then(data => console.log(data)).catch(e => console.error(e));
        // 每个人发2次
        for (let i = 0; i < 2; i++) {
          let p = apis.sendMsg(args.barrage, args.roomId).then(data => {
            console.log(data);
            return data;
          }).catch(e => {
            console.error(e);
          });
          ps.push(p);
        }
      } else {
        console.error('cookies is null %s', row.explicit_uid);
      }
    }
    Promise.all(ps).then((r) => {
      let notification = new Notification({
        title: 'Now直播助手',
        body: '共发送' + String(r.length) + '条弹幕'
      });
      notification.show();
    });
  });
});
