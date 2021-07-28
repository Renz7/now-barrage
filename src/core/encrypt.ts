import { Cookie } from 'electron';

export function encryptCode(e: any): any {
  if (!e)
    return '';
  let t = 5381;
  for (let n = 0, o = e.length; n < o; ++n)
    t += (t << 5) + e.charAt(n).charCodeAt(0);
  return 2147483647 & t;
}


export function decodeCookie(e: string, cookies: Cookie[]): string {
  // var t = document.cookie.match(new RegExp("(^| )" + e + "=([^;]*)(;|$)"));
  let r = '';
  for (const cookiesKey in cookies) {
    if (cookies[cookiesKey].name == e) {
      r = decodeURIComponent(cookies[cookiesKey].value);
    }
  }
  return r;
}

export function getBkn(cookies: any): string {
  let e = decodeCookie('ilive_a2', cookies)
    , t = decodeCookie('a2', cookies);
  return encryptCode(e ? e : t ? t : decodeCookie('skey', cookies));
}

export function getUid(cookies: any): number {
  for (const cookiesKey in cookies) {
    if (cookies[cookiesKey].name == 'ilive_uin') {
      return cookies[cookiesKey].value;
    }
  }
  throw  Error('uid not found');
}

