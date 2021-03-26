import { InviteLinkRegex } from '@constants'
import chalk from 'chalk'
import type { AkairoClient } from 'discord-akairo'
import { Collection, Message, NewsChannel, TextChannel } from 'discord.js'

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

export const validate = (client: AkairoClient) => {
    const { config, config: { botChannelIds, categoryIds, checkChannelId, debug, ignoreIds, interval, logChannelId, serverId }, guilds: { cache: guildCache } } = client
    const botName = client.user.username
    const states = {}

    if (debug) {
        console.log(chalk`{bold.underline ${ 'Provided config' }}`)
        console.log(config, '\n')
    }

    if (!guildCache?.size)
        states['SERVERS'] = chalk`{white ${ `[SERVERS] - ${ botName } is not in any server.` }}`
    if (guildCache?.size !== 1)
        states['SERVERS'] = chalk`{white ${ `[SERVERS] - ${ botName } is in more than one server.` }}`
    if (!serverId)
        states['SERVER_ID'] = chalk`{red ${ '[SERVER_ID]' }} - {white ${ 'Not provided in .env file.' }}`

    const guild = guildCache.get(config.serverId)

    if (!guild)
        states['SERVERS'] = chalk`{white ${ `[SERVERS] - ${ botName } is not in the server with ID ${ config.serverId }.` }}`
    else {
        const channelCache = guild.channels.cache
        const data = [
            { items: botChannelIds, invalidItems: [...new Set(botChannelIds)].filter(channelId => channelCache.get(channelId)?.type !== 'text'), setting: 'BOT_CHANNEL_IDS' },
            { items: categoryIds, invalidItems: [...new Set(categoryIds)].filter(channelId => channelCache.get(channelId)?.type !== 'category'), setting: 'CATEGORY_IDS' },
            { items: checkChannelId, invalid: checkChannelId && channelCache.get(checkChannelId)?.type !== 'text', setting: 'CHECK_CHANNEL_ID' },
            { items: ignoreIds, invalidItems: [...new Set(ignoreIds)].filter(channelId => channelCache.get(channelId)?.type !== 'text'), setting: 'IGNORE_IDS' },
            { items: logChannelId, invalid: logChannelId && channelCache.get(logChannelId)?.type !== 'text', setting: 'LOG_CHANNEL_ID' }
        ]

        for (const { items, invalid, invalidItems, setting } of data) {
            const colour = ['CATEGORY_IDS', 'CHECK_CHANNEL_ID'].includes(setting) ? 'red' : 'yellow'
            if (!items?.length)
                states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ 'Not provided in .env file.' }}`
            if (['CHECK_CHANNEL_ID', 'LOG_CHANNEL_ID'].includes(setting) && invalid)
                states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ formatChannels([items as string], 'text') }}`
            if (['BOT_CHANNEL_IDS', 'CATEGORY_IDS', 'IGNORE_IDS'].includes(setting) && invalidItems.length)
                states[setting] = chalk`{${ colour } ${ `[${ setting }]` }} - {white ${ formatChannels(invalidItems, setting === 'CATEGORY_IDS' ? 'category' : 'text') }}`
        }
    }

    const messages = Object.values(states)

    if (messages.length) {
        console.log(chalk`{bold.underline ${ `Just a heads-up, ${ botName } has the following issue(s):` }}`)

        for (const message of messages)
            console.log(message)

        console.log()
        console.log(chalk`{bold.white ${ 'NOTE: '}}{red ${ 'Red issues' }} must be fixed in order for ${ botName } to work, {yellow ${ 'yellow issues' }} may be ignored.`)
    }
}