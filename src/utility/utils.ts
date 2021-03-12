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

export const formatChannels = (channelIds: string[], type: 'category' | 'server' | 'text' ) => {
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
    const text = `${ channelText } ${ length <= 1 ? `is an invalid ${ type === 'server' ? 'server' : `${ type } channel` } ID` : `are invalid ${ type === 'server' ? 'server' : `${ type } channel` } IDs` }.`

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
    const botName = client.user.username
    const { activityName, activityType, botChannelIds, categoryIds, checkChannelId, ignoreIds, interval, logChannelId, prefix, serverIds } = client.config
    const guildCache = client.guilds.cache
    const invalidServerIds = serverIds.filter(serverId => !guildCache.has(serverId))
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
        'SERVER_IDS': { message: '' },
    }

    if (!serverIds.length) {
        states['SERVER_IDS'].message = chalk`{red ${ 'SERVER_IDS' }} - {white ${ 'Please provide the server IDs this bot will be on.' }}`
        valid = false
    }
    if (invalidServerIds.length) {
        states['SERVER_ID'].message = chalk`{red ${ 'SERVER_IDS' }} - {white ${ formatChannels(invalidServerIds, 'server') }}`
        valid = false
    } else {
        const channelCache = client.channels.cache
        const invalidBotChannelIds = [...new Set(botChannelIds)].filter(channelId => !channelCache.has(channelId) || channelCache.get(channelId).type !== 'text')
        const invalidCategoryIds = [...new Set(categoryIds)].filter(channelId => !channelCache.has(channelId) || channelCache.get(channelId).type !== 'category')
        const invalidCheckChannelId = [checkChannelId].filter(channelId => !channelCache.has(channelId) || channelCache.get(channelId).type !== 'text')
        const invalidIgnoreIds = [...new Set(ignoreIds)].filter(channelId => !channelCache.has(channelId) || !['news', 'text'].includes(channelCache.get(channelId).type))
        const invalidLogChannelId = [logChannelId].filter(channelId => !channelCache.has(channelId) || channelCache.get(channelId).type !== 'text')

        if (invalidBotChannelIds.length) {
            states['BOT_CHANNEL_IDS'].message = chalk`{red ${ '[BOT_CHANNEL_IDS]' }} - {white ${ formatChannels(invalidBotChannelIds, 'text') }}`
            valid = false
        }
        if (invalidCategoryIds.length) {
            states['CATEGORY_IDS'].message = chalk`{red ${ '[CATEGORY_IDS]' }} - {white ${ formatChannels(invalidCategoryIds, 'category') }}`
            valid = false
        }
        if (invalidCheckChannelId.length) {
            states['CHECK_CHANNEL_ID'].message = chalk`{red ${ '[CHECK_CHANNEL_ID]' }} - {white ${ formatChannels(invalidCheckChannelId, 'text') }}`
            valid = false
        }
        if (invalidIgnoreIds.length) {
            states['IGNORE_IDS'].message = chalk`{red ${ '[IGNORE_IDS]' }} - {white ${ formatChannels(invalidIgnoreIds, 'text') }}`
            valid = false
        }
        if (invalidLogChannelId.length) {
            states['LOG_CHANNEL_ID'].message = chalk`{red ${ '[LOG_CHANNEL_ID]' }} - {white ${ formatChannels(invalidLogChannelId, 'text') }}`
            valid = false
        }
    }
    if ((interval < 1000) || (interval > 5000)) {
        states['INTERVAL'].message = chalk`{red ${ '[INTERVAL]' }} - {white ${ 'Please use a positive integer between 1000 - 5000.' }}`
        valid = false
    }

    const reDigit = /^[0-9]/
    const reSpecial = /[~`!@#\$%\^&*()-_\+={}\[\]|\\\/:;"'<>,.?]/g
    const reSpaces = /\s/
    const validPrefix = !reDigit.test(prefix) && reSpecial.test(prefix) && !reSpaces.test(prefix) && (prefix.length <= 3)

    if (!validPrefix) {
        states['PREFIX'].message = chalk`{red ${ '[PREFIX]' }} - {white ${ 'Bot prefix must not contain spaces, not contain spaces, have at least one special character, and be a maximum of three characters.' }}`
        valid = false
    }
    
    const validActivityName = !!activityName && activityName?.length <= 40
    const validActivityTypes = ['listening to', 'playing', 'watching']
    const validActivityType = !!activityType?.length && validActivityTypes.includes(activityType?.toLowerCase())
    
    if (!validActivityName)
        console.log(chalk`{bold ${ '[INFO]' }} - ${ activityName?.length ? 'Provided activity name must be fewer than 40 characters. ' : '' }The default activity name will be used for the bot status.`)
    if (!validActivityType)
        console.log(chalk`{bold ${ '[INFO]' }} - ${ activityType?.length ? 'Provided activity type must be either "listening to", "playing", or "watching". ' : ''}The default activity type will be used for the bot status.`)
    
    console.log()

    if (!valid) {
        console.log(chalk`{bold.underline ${ `Please fix the following errors and restart ${ botName }:` }}`)
        for (const { message } of Object.values(states)) {
            if (message.length)
                console.log(message)
        }

        process.exit(0)
    }

    return { name: validActivityName ? activityName : 'a lot of invites!', type: getType(activityType) }
}