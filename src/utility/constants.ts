import { BOT_CHANNEL_IDS, CATEGORY_IDS, CHECK_CHANNEL_ID, DEBUG, IGNORE_IDS, INTERVAL, LOG_CHANNEL_ID, PREFIX, SERVER_ID, TOKEN } from '../config'
import type { MessageEmbed, TextChannel } from 'discord.js'
import pms from 'pretty-ms'

export interface CherryConfig {
    botChannelIds: string[]
    categoryIds: string[]
    checkChannelId: string | null
    debug: boolean
    ignoreIds: string[]
    interval: number | null
    logChannelId: string | null
    prefix: string
    serverId: string | null
    token: string | null
}

console.log({
    botChannelIds: BOT_CHANNEL_IDS,
    categoryIds: CATEGORY_IDS,
    checkChannelId: CHECK_CHANNEL_ID,
    debug: DEBUG,
    ignoreIds: IGNORE_IDS,
    interval: INTERVAL,
    logChannelId: LOG_CHANNEL_ID,
    prefix: PREFIX,
    serverId: SERVER_ID,
    token: TOKEN
 })


export const config: CherryConfig = {
    botChannelIds: BOT_CHANNEL_IDS,
    categoryIds: CATEGORY_IDS,
    checkChannelId: CHECK_CHANNEL_ID,
    debug: DEBUG,
    ignoreIds: IGNORE_IDS,
    interval: INTERVAL,
    logChannelId: LOG_CHANNEL_ID,
    prefix: PREFIX,
    serverId: SERVER_ID,
    token: TOKEN
}

export const EMBEDS = {
    CATEGORY: (categoryName: string, resultsDescription?: string, issuesDescription?: string[]) => {
        const embed: Partial<MessageEmbed> = {
            color: 16316671,
            description: resultsDescription ?? 'No channels to check in this category.',
            footer: { text: `Checked ${ resultsDescription ? 8 : 0 } messages` },
            timestamp: Date.now(),
            title: `The "${ categoryName }" category`,
        }

        if (issuesDescription?.length)
            embed!.fields = [{ inline: false, name: 'Issues', value: issuesDescription.join('\n') }]

        return { embed }
    },
    INFO: (description: string) => {
        const embed: Partial<MessageEmbed> = { color: 16316671, description }

        return { embed }
    },
    ERROR: (description: string) => {
        const embed: Partial<MessageEmbed> = { color: 11534368, description }

        return { embed }
    },
    RESULTS: (bad: number, channels: number, good: number, total: number, elapsedTimeMilliseconds: number) => {
        const embed: Partial<MessageEmbed> = {
            color: 16316671,
            fields: [
                { inline: false, name: 'Check counts', value: [`Channels checked: ${ channels }`, `Invites checked: ${ total }`].join('\n') },
                { inline: false, name: 'Elapsed time', value: pms(elapsedTimeMilliseconds, { secondsDecimalDigits: 0, separateMilliseconds: true }) },
                {
                    inline: false,
                    name: 'Stats',
                    value: [
                        `- ${ good }/${ total } good invites (${ (100 * good / total).toFixed(2) }% 🟢)`,
                        `- ${ bad }/${ total } bad invites (${ (100 * bad / total).toFixed(2) }% 🔴)`
                    ].join('\n')
                }
            ],
            title: 'Invite check results'
        }

        return { embed }
    },
    SUCCESS: (description: string) => {
        const embed: Partial<MessageEmbed> = { color: 45088, description }

        return { embed }
    }
}

export const InviteLinkRegex = /(?:https?:\/\/)?(?:\w+\.)?discord(?:(?:app)?\.com\/invite|\.gg)\/(?<code>[a-z0-9-]+)/gi

// [] = Optional
// <> = Required
export const MESSAGES = {
    COMMANDS: {
        CHECK: {
            TEXT: 'Runs an invite check on provided categories.',
            USAGE: 'check'
        },
        GUIDE: {
            TEXT: 'A guide to the bot.',
            USAGE: 'guide'
        },
        HELP: {
            TEXT: 'Displays all available commands, including information about a specific command or category.',
            USAGE: 'help [query]',
            EXAMPLES: ['help ping', 'help category']
        },
        IDS: {
            TEXT: 'Displays a list of all category IDs in a server.',
            USAGE: 'ids'
        },
        PING: {
            TEXT: 'Checks server latency.',
            USAGE: 'ping'
        },
        SETTINGS: {
            TEXT: 'Displays a guild\'s current settings.',
            USAGE: 'settings'
        },
        STATE: {
            TEXT: 'Displays status of invite check.',
            USAGE: 'state'
        },
        STATS: {
            TEXT: 'Displays bot information.',
            USAGE: 'stats'
        },
        SUPPORT: {
            TEXT: 'Gets the invite link for Sakura\'s support server.',
            USAGE: 'support'
        }
    },
    INFO: {
        CHECK_START: (botName: string) => EMBEDS.INFO(`An invite check is currently in progress. Please give ${ botName } a few hours to check your channels.`),
        CHECK_COMPLETE: EMBEDS.SUCCESS('Invite check complete!'),
        IN_CHECK: EMBEDS.INFO('You already have an invite check in progress. Please wait until your current invite check ends before running another one.'),
        NO_CATEGORIES: EMBEDS.INFO('There are no categories to check. Please provide category channel IDs in your `.env` file.'),
        NO_CHECK: EMBEDS.INFO('You do not have an invite check in progress.'),
        NO_MATCH: EMBEDS.INFO('No match found.'),
        WRONG_CHANNEL: (channel: TextChannel) => EMBEDS.INFO(`This command can only be run in ${ channel }.`)
    },
    ERRORS: {
        CHECK_CHANNEL: EMBEDS.ERROR('Please provide a valid **text** channel ID in your `.env` file.'),

    },
    STATES: {
        
    }
}