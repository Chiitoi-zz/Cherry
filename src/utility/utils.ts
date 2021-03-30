import { InviteLinkRegex, Settings, config } from '@constants'
import chalk from 'chalk'
import type { AkairoClient } from 'discord-akairo'
import { Collection, GuildChannel, Message, NewsChannel, TextChannel } from 'discord.js'

const delay = ms => new Promise(res => setTimeout(res, ms))

export const extractCodes = (messages: Collection<string, Message>) => {
    const matches = messages.reduce((acc, message) => {
        const { content } = message
        const results = JSON.stringify(content).matchAll(InviteLinkRegex) 
        
        return [...acc, ...results]
    }, [])
    const codes: string[] = matches.map(match => match[1])
    
    return codes
}

export const format = (x: number | string) => x.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')

export const formatChannels = (channelIds: string[], type: 'category' | 'text') => {
    const { length } = channelIds
    const channelText = channelIds.reduce((acc, channelId, index) => {
        if (index == length - 2)
            acc += `${ channelId }${ length == 2 ? '' : ','} and `
        else if (index == length - 1)
            acc += `${ channelId }`
        else
            acc += `${ channelId }, `
        return acc
    }, '')
    const text = `${ channelText } ${ length <= 1 ? `is an invalid ${ type } channel ID` : `are invalid ${ type } channel IDs` }.`

    return text    
}

export const formatInterval = () => {
    const interval = +config.interval

    if (interval && Number.isInteger(interval) && (interval >= 1000) && (interval <= 5000))
        return interval
    return 5000
}

export const formatStatus = () => {
    const { status } = config

    if (!status)
        return []
    
    const validStatuses: { name: string, type: 'COMPETING' | 'LISTENING' | 'PLAYING' | 'WATCHING' }[] = []
    const statusCased = status.toLowerCase()

    if (statusCased.startsWith('competing in'))
        validStatuses.push({ type: 'COMPETING', name: status.substring(12).trim() })
    if (statusCased.startsWith('listening to'))
        validStatuses.push({ type: 'LISTENING', name: status.substring(12).trim() })
    if (statusCased.startsWith('playing'))
        validStatuses.push({ type: 'PLAYING', name: status.substring(7).trim() })
    if (statusCased.startsWith('watching'))
        validStatuses.push({ type: 'WATCHING', name: status.substring(8).trim() })

    return validStatuses
}

export async function handle<T>(promise: Promise<T>) {
    return promise
        .then(resolve)
        .catch(reject)
}

export const processResults = (results: Collection<string, { code: string, valid: boolean }[]>, issues: { unknown: number, known: (NewsChannel | TextChannel)[] }) => {
    let bad = 0, issuesDescription: string[] = [], resultsDescription = '', total = 0

    for (const [channelId, channelResult] of results) {
        const resultCount = channelResult.length

        if (!channelResult.length) {
            resultsDescription += `🔴<#${ channelId }> - 0 found\n`
            continue
        }

        const badCount = channelResult.filter(({ valid }) => !valid).length
        total += resultCount
        bad += badCount

        if (badCount)
            resultsDescription += `🔴<#${ channelId }> - ${ badCount }/${ resultCount } bad\n`
        else
            resultsDescription += `🟢<#${ channelId }> - ${ resultCount }/${ resultCount } good\n`
    }

    if (issues.unknown)
        issuesDescription.push(`- ${ issues.unknown } channel(s) could not be checked.`)
    if (issues.known.length) {
        const channelDescription = issues.known.map(channel => `<#${ channel.id }>`).join(', ')
        issuesDescription.push(`- The following need manual checks: ${ channelDescription }`)
    }

    return { bad, channels: results.size, good: total - bad, issuesDescription, resultsDescription, total }
}

function resolve<T>(data: T): [T, undefined] {
    return [data, undefined]
}

function reject(error): [undefined, any] {
    return [undefined, error]
}

export const validate = async (client: AkairoClient) => {
    await delay(7000)

    const { botChannelIds, categoryIds, checkChannelId, ignoreIds, interval, logChannelId, prefix, serverId, status } = client.config
    const botName = client.user.username
    const guildCache = client.guilds.cache
    const guildChannelCaches: Collection<string, GuildChannel>[] = guildCache.map(guild => guild.channels.cache)
    const channelCache = new Collection<string, GuildChannel>().concat(...guildChannelCaches)
    const settings: Settings = {
        'BOT_CHANNEL_IDS': { items: botChannelIds, invalidItems: [...new Set(botChannelIds)].filter(channelId => channelCache.get(channelId)?.type !== 'text') },
        'CATEGORY_IDS': { items: categoryIds, invalidItems: [...new Set(categoryIds)].filter(channelId => channelCache.get(channelId)?.type !== 'category') },
        'CHECK_CHANNEL_ID': { items: checkChannelId, invalid: checkChannelId && channelCache.get(checkChannelId)?.type !== 'text' },
        'IGNORE_IDS': { items: ignoreIds, invalidItems: [...new Set(ignoreIds)].filter(channelId => channelCache.get(channelId)?.type !== 'text') },
        'INTERVAL': { items: interval, invalid: +interval && (!Number.isInteger(+interval) || (+interval < 1000) || (+interval > 5000)) },
        'LOG_CHANNEL_ID': { items: logChannelId, invalid: logChannelId && channelCache.get(logChannelId)?.type !== 'text' },
        'PREFIX': { items: prefix, invalid: prefix && (/^[0-9]/.test(prefix) || !/[~`!@#\$%\^&*()-_\+={}\[\]|\\\/:;"'<>,.?]/g.test(prefix) || /\s/.test(prefix) || (prefix.length > 3)) },
        'SERVER_ID': { items: serverId, invalid: serverId && !guildCache.has(serverId) },
        'STATUS': { items: status, invalid: status && !['competing in', 'listening to', 'playing', 'watching'].some(start => status.toLowerCase().startsWith(start)) }
    }
    const states = {}

    for (const [setting, { items, invalid, invalidItems }] of Object.entries(settings)) {
        const colour = ['CATEGORY_IDS', 'CHECK_CHANNEL_ID'].includes(setting) ? 'red' : 'yellow'

        if (!items?.length)
            states[`${ setting }`] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ `Not provided in .env file.${ setting === 'INTERVAL' ? ' 5000 will be used here as a default.' : '' }` }}`
        if (['BOT_CHANNEL_IDS', 'CATEGORY_IDS', 'IGNORE_IDS'].includes(setting) && invalidItems.length)
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ formatChannels(invalidItems, setting === 'CATEGORY_IDS' ? 'category' : 'text') }}`
        if (['CHECK_CHANNEL_ID', 'LOG_CHANNEL_ID'].includes(setting) && invalid)
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ formatChannels([items as string], 'text') }}`
        if ((setting === 'INTERVAL') && (invalid || Number.isNaN(invalid)))
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - Must be a positive integer between 1000 and 5000. 5000 will be used here as a default.`
        if ((setting === 'PREFIX') && invalid)
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - Must not contain digits, have at least one special character, not contain spaces, and be a maximum of three characters.`
        if ((setting === 'SERVER_ID') && invalid) {
            const message = !guildCache?.size ? `${ botName } is not in any server.` : `${ botName } is not in the server with ID ${ serverId }.`
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ message }}`
        }
        if ((setting === 'STATUS') && invalid)
            states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - Must start with either {bold ${ 'Competing in' }}, {bold ${ 'Listening to' }}, {bold ${ 'Playing' }} or {bold ${ 'Watching' }}.`
    }

    const messages = Object.values(states)

    if (messages.length) {
        console.log(chalk`{bold.underline ${ `Just a heads-up, ${ botName } has the following issue(s):` }}`)

        for (const message of messages)
            console.log(message)

        console.log()
        console.log(chalk`{bold.white ${ 'NOTE: '}}{red ${ 'Red issues' }} must be fixed in order for ${ botName } to work properly, {yellow ${ 'yellow issues' }} may be ignored.`)
    }
}