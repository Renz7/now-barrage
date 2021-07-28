import { getBkn } from './encrypt';
import { Cookie } from 'electron';
import { DbRow } from './interfaces';
import { Database } from 'sqlite3';

const db = new Database('./now-tool.sqlite3');

db.serialize(function() {
  db.run('create table if not exists cookies( id identity INT constraint cookies_pk primary key,explicit_uid INT,user_type INT, logo_full_url TEXT, cookies TEXT, bkn INT );');
});


export function saveCookie(id: number, explicit_uid: number, cookies: Cookie[], user_type?: string, logo_full_url?: string, bkn?: string | number) {
  return new Promise<void>((resolve, reject) => {
    bkn = bkn ? bkn : getBkn(cookies);
    db.run('replace into cookies(id,explicit_uid,user_type,logo_full_url,cookies,bkn) values (?,?,?,?,?,?)', id, explicit_uid, user_type, logo_full_url, JSON.stringify(cookies), bkn, function(err: Error | null) {
      if (err) reject(err);
      console.log('insert new row for %d', explicit_uid);
      resolve();
    });
  });
}

export default function getCookie(id: number) {
  return new Promise((resolve, reject) => {
    db.run('select cookies,bkn from cookies where id=?', id, function(err: Error | null) {
      if (err) reject(err);
      resolve(null);
    });
  });
}

export function getAllCookies(): Promise<DbRow[]> {
  return new Promise((resolve, reject) => {
    db.all('select id,explicit_uid,user_type,logo_full_url,cookies,bkn from cookies', [], (e: any, rows: any[]) => {
      let resultSet = rows.map((v) => {
        let row: DbRow = JSON.parse(JSON.stringify(v));
        return row;
      });
      resolve(resultSet);
      if (e) {
        reject(e);
      }
    });
  });

}
