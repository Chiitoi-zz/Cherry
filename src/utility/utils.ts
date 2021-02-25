import { InviteLinkRegex } from '@constants'
import chalk from 'chalk'
import { Collection, Message, NewsChannel, TextChannel } from 'discord.js'
import { AkairoClient } from 'discord-akairo'

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
    const text = `${ channelText } ${ length >=1 ? `is an invalid ${ type } channel ID` : `are invalid ${ type } channel IDs` }.`

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

const getType = (type: string): 'LISTENING' | 'PLAYING' | 'WATCHING' => {
    const lowered = type?.toLowerCase()

    if (lowered == 'listening to')
        return 'LISTENING'
    else if (lowered == 'playing')
        return 'PLAYING'
    else
        return 'WATCHING'
}

export const validate = (client: AkairoClient) => {
    let valid = true
    const { activityName, activityType, botChannelIds, categoryIds, checkChannelId, ignoreIds, interval, logChannelId, prefix, serverId } = client.config
    const guild = client.guilds.cache.get(serverId)
    const states = {
        'ACTIVITY_NAME': { message: '' },
        'ACTIVITY_TYPE': { message: '' },
        'BOT_CHANNEL_IDS': { message: '' },
        'CATEGORY_IDS': { message: '' },
        'CHECK_CHANNEL_ID': { message: '' },
        'IGNORE_IDS': { message: '' },
        'INTERVAL': { message: '' },
        'LOG_CHANNEL_ID': { message: '' },
        'PREFIX': { message: '' },
        'SERVER_ID': { message: '' },
    }

    if (!serverId)
        states['SERVER_ID'].message = chalk`{red ${ 'SERVER_ID' }} - {white ${ 'Please provide the server ID this bot will be on.' }}`
    if (!guild)
        states['SERVER_ID'].message = chalk`{red ${ 'SERVER_ID' }} - {white ${ 'Please provide a valid server ID.' }}`
    if (guild) {
        const guildChannels = guild.channels.cache
        const invalidBotChannelIds = [...new Set(botChannelIds)].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'text')
        const invalidCategoryIds = [...new Set(categoryIds)].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'category')
        const invalidIgnoreIds = [...new Set(ignoreIds)].filter(channelId => !guildChannels.has(channelId) || !['news', 'text'].includes(guildChannels.get(channelId).type))

        if (invalidBotChannelIds.length)
            states['BOT_CHANNEL_IDS'].message = chalk`{red ${ 'BOT_CHANNEL_IDS' }} - {white ${ formatChannels(invalidBotChannelIds, 'text') }}`


    }

    for (const { message } of Object.values(states)) {
        if (message.length)
            console.log(message)
    }

    
    
    return null

    // const validActivityName = activityName?.length <= 40
    // const validActivityTypes = ['listening to', 'playing', 'watching']
    // const validActivityType = activityType?.length && validActivityTypes.includes(activityType.toLowerCase())
    
    // if (!validActivityName) {
    //     console.log(chalk`{red ${ 'ACTIVITY_NAME' }} - {white ${ 'Must be fewer than 40 characters. The default activity name will be used here.' }}`)
    //     valid = false
    // }
    // if (!validActivityType) {
    //     console.log(chalk`{red ${ 'ACTIVITY_TYPE' }} - {white ${ 'Must be either "listening to", "playing", or "watching". The default activity type will be used here.' }}`)
    //     valid = false
    // }
    // if (!serverId) {
    //     console.log(chalk`{red ${ 'SERVER_ID' }} - {white ${ 'Please provide the server ID this bot will be on.' }}`)
    //     valid = false
    // }

    // return valid ? { name: validActivityName ? activityName : 'a lot of invites!', type: getType(activityType) } : valid

}