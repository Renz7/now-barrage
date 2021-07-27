import {Cookie, net, session} from "electron";
import {stringify} from "querystring"
import {getBkn} from "./encrypt";
import {LoginData, Resp} from "./interfaces";


export class Apis {
  private cookies: Electron.Cookie[];
  private readonly sess: Electron.Session;

  constructor(cookies: Cookie[]) {
    this.cookies = cookies;
    this.sess = session.fromPartition(new Date().getMilliseconds().toString())
    for (const cookiesKey in this.cookies) {
      let cookie = this.cookies[cookiesKey]
      this.sess.cookies.set(
        {
          url: 'https://now.qq.com/',
          name: cookie.name,
          value: cookie.value
        }
      ).then(() => {
      }, e => {
        console.error('set cookies failed', e)
      })
    }
  }

  setCookies(cookies: Cookie[]) {
    this.cookies = cookies
  }

  static getRandom_() {
    return Math.random().toString();
  }


  /**
   * @param {number|string|((substring: string, ...args: *[]) => string)} roomId
   * @param {function(Object)=>void} dataFunc
   */
  getRoomInfo = (roomId: number, dataFunc: (data: any) => {}) => {
    return new Promise((resolve, reject) => {
      const urlPrefix = 'https://now.qq.com/cgi-bin/now/web/room/get_room_info_v2?room_id={roomId}&src=2&qq_version=&from=now_web&bkn={bkn}&_={_}'
      const req = net.request(
        {
          url: urlPrefix.replace('{roomId}', String(roomId)).replace('{bkn}', getBkn(this.cookies)).replace('{_}', Apis.getRandom_()),
          useSessionCookies: true,
          session: this.sess,
        }
      )
      req.setHeader('user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36")
      req.once('response', response => {
        response.on('data', chunk => {
          try {
            let data = JSON.parse(chunk.toString('utf8'))
            dataFunc ? dataFunc(data) : null
            resolve(data);
          } catch (e) {
            console.error("请求room 信息失败" + e.toString())
            reject(e)
          }
        })
        response.on('error', (e: any) => {
          console.error(e)
          reject(e)
        })
      })
      req.end()
    })
  }

  login = (dataFunc?: (data: any) => {}): Promise<Resp<LoginData>> => {
    return new Promise(((resolve, reject) => {
        const urlPrefix = "https://now.qq.com/cgi-bin/now/web/user/login?bkn={bkn}"
        const req = net.request(
          {
            url: urlPrefix.replace("{bkn}", getBkn(this.cookies)),
            method: "POST",
            useSessionCookies: true,
            session: this.sess
          }
        )
        req.setHeader('referer', "https://now.qq.com/pcweb/index.html?s=pcofs")
        req.setHeader('user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36")
        req.once('response', response => {
          response.on('data', chunk => {
            try {
              let data: Resp<LoginData> = JSON.parse(chunk.toString())
              if (data.retcode !== 0) {
                reject("non-zero response retcode")
              }
              dataFunc ? dataFunc(data) : null
              resolve(data);
            } catch (e) {
              reject(e)
            }
          })
          response.on("error", (e: any) => {
            reject(e)
          })
        })
        req.write(
          stringify({
            "room_id": 0,
            "login_way": 1,
            "bkn": getBkn(this.cookies),
            "_": Apis.getRandom_()
          })
        )
        req.end()
      }
    ))
  }
  sendMsg = (msg: string, roomId: number) => {
    return new Promise(((resolve, reject) => {
      const urlPrefix = "https://now.qq.com/cgi-bin/now/web/chat/send_msg?bkn={bkn}"
      const req = net.request(
        {
          url: urlPrefix.replace("{bkn}", getBkn(this.cookies)),
          method: "POST",
          useSessionCookies: true,
          session: this.sess
        }
      )
      req.setHeader('user-agent', "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36")
      req.setHeader('referer', "https://now.qq.com/pcweb/story.html?roomid={room}".replace("{room}", String(roomId)))
      req.setHeader("content-type", "application/x-www-form-urlencoded")
      req.once("response", response => {
        response.on('data', function (chunk) {
          try {
            let data = JSON.parse(chunk.toString())
            if (data.retcode !== 0 || !data.result.is_ok) {
              console.log(data)
              reject("retcode not 0")
            }
            resolve(data)
          } catch (e) {
            reject(e)
          }
          {
          }
        })
      })
      req.on("error", function (e) {
        console.error(e)
      })
      req.write(stringify({
        message: msg,
        room_id: roomId,
        bkn: getBkn(this.cookies),
        _: Apis.getRandom_()
      }))
      req.end()
    }))
  }
}

module.exports = {
  Apis
}
