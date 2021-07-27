export interface Resp<data> {
  retcode: number
  result?: data
}


export interface LoginData {
  info: {
    explicit_uid: number
    uid_64?: string
    user_gender?: number
    user_id: number
    user_logo_url: string
    user_nick: string
    user_type: number
  }
  result?: number
}


export interface DbRow {
  id: number
  explicit_uid: number
  user_type?: string
  logo_full_url?: string
  cookies?: string
}
