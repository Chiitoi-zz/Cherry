import { InviteLinkRegex } from '@constants'
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

