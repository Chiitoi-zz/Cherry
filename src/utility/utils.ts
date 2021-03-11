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
    let valid = true
    const botName = client.user.username
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

    if (!serverId) {
        states['SERVER_ID'].message = chalk`{red ${ 'SERVER_ID' }} - {white ${ 'Please provide the server ID this bot will be on.' }}`
        valid = false
    }
    if (!guild) {
        states['SERVER_ID'].message = chalk`{red ${ 'SERVER_ID' }} - {white ${ 'Please provide a valid server ID the bot is in.' }}`
        valid = false
    }
    if (guild) {
        const guildChannels = guild.channels.cache
        const invalidBotChannelIds = [...new Set(botChannelIds)].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'text')
        const invalidCategoryIds = [...new Set(categoryIds)].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'category')
        const invalidCheckChannelId = [checkChannelId].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'text')
        const invalidIgnoreIds = [...new Set(ignoreIds)].filter(channelId => !guildChannels.has(channelId) || !['news', 'text'].includes(guildChannels.get(channelId).type))
        const invalidLogChannelId = [logChannelId].filter(channelId => !guildChannels.has(channelId) || guildChannels.get(channelId).type !== 'text')

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

    const statuses = [process.env.STATUS_1, process.env.STATUS_2, process.env.STATUS_3]
    const validStatuses: { name: string, type: 'COMPETING' | 'LISTENING' | 'PLAYING' | 'WATCHING' }[] = []

    for (const [index, status] of Object.entries(statuses)) {
        if(!status?.length) {
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - Not provided.`)
            continue
        }

        const statusCased = status.toLowerCase()

        if (statusCased.startsWith('competing in')) {
            validStatuses.push({ type: 'COMPETING', name: status.substring(12).trim() })
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - {green ${ 'VALID' }}.`)
        } else if (statusCased.startsWith('listening to')) {
            validStatuses.push({ type: 'LISTENING', name: status.substring(12).trim() })
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - {green ${ 'VALID' }}.`)
        } else if (statusCased.startsWith('playing')) {
            validStatuses.push({ type: 'PLAYING', name: status.substring(7).trim() })
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - {green ${ 'VALID' }}.`)
        } else if (statusCased.startsWith('watching')) {
            validStatuses.push({ type: 'WATCHING', name: status.substring(8).trim() })
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - {green ${ 'VALID' }}.`)
        } else
            console.log(chalk`{bold ${ `[STATUS_${ +index + 1}]` }} - This status must start with either {bold ${ 'Competing in' }}, {bold ${ 'Listening to' }}, {bold ${ 'Playing' }} or {bold ${ 'Watching' }}.`)
    }
    if (client.guilds.cache?.size > 1)
        console.log(chalk`{bold ${ '[INFO]' }} - ${ botName } is in ${ client.guilds.cache.size } servers. Please ensure that your ${ botName } is only in the one server it's supposed to be in.`)
    
    console.log()

    if (!valid) {
        console.log(chalk`{bold.underline ${ `Please fix the following errors and restart ${ botName }:` }}`)
        for (const { message } of Object.values(states)) {
            if (message.length)
                console.log(message)
        }

        process.exit(0)
    }

    return validStatuses
}