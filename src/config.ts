export const BOT_CHANNEL_IDS = process.env.BOT_CHANNEL_IDS?.length ? process.env.BOT_CHANNEL_IDS.split(',') : []
export const CATEGORY_IDS = process.env.CATEGORY_IDS?.length ? process.env.CATEGORY_IDS.split(',') : []
export const CHECK_CHANNEL_ID = process.env.CHECK_CHANNEL_ID?.length ? process.env.CHECK_CHANNEL_ID : null
export const DEBUG = (process.env.DEBUG === 'true')
export const IGNORE_IDS = process.env.IGNORE_IDS?.length ? process.env.IGNORE_IDS.split(',') : []
export const INTERVAL = process.env.INTERVAL?.length ? process.env.INTERVAL : null
export const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID?.length ? process.env.LOG_CHANNEL_ID : null
export const PREFIX = process.env.PREFIX?.length ? process.env.PREFIX : null
export const PRESENCE_STATUS = (process.env.PRESENCE_STATUS?.length && ['dnd', 'idle', 'invisible', 'online'].includes(process.env.PRESENCE_STATUS) ? process.env.PRESENCE_STATUS : 'online') as 'dnd' | 'idle' | 'invisible' | 'online'
export const SERVER_ID = process.env.SERVER_ID?.length ? process.env.SERVER_ID : null
export const STATUS = process.env.STATUS?.length ? process.env.STATUS : null
export const TOKEN = process.env.TOKEN?.length ? process.env.TOKEN : null
export const VALIDATE = (process.env.VALIDATE === 'true')