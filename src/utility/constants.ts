import { BOT_CHANNEL_IDS, CATEGORY_IDS, CHECK_CHANNEL_ID, IGNORE_IDS, INTERVAL, LOG_CHANNEL_ID, PREFIX, SERVER_ID, TOKEN } from '../config'

export interface CherryConfig {
    botChannelIds: string[]
    categoryIds: string[]
    checkChannelId: string
    ignoreIds: string[]
    interval: number
    logChannelId: string
    prefix: string
    serverId: string
    token: string
}

export const config: CherryConfig = {
    botChannelIds: BOT_CHANNEL_IDS,
    categoryIds: CATEGORY_IDS,
    checkChannelId: CHECK_CHANNEL_ID,
    ignoreIds: IGNORE_IDS,
    interval: INTERVAL,
    logChannelId: LOG_CHANNEL_ID,
    prefix: PREFIX,
    serverId: SERVER_ID,
    token: TOKEN
}

export const EMBEDS = {
    CATEGORY: (categoryName: string, resultsDescription?: string, issuesDescription?: string[]) => {
        const embed: any = {
            title: `The "${ categoryName }" category`,
            color: 'F8F8FF',
            description: resultsDescription ?? 'No channels to check in this category.',
            footer: { text: `Checked ${ resultsDescription ? 8 : 0 } messages` },
            timestamp: Date.now()
        }

        if (issuesDescription?.length)
            embed!.fields = [{ name: 'Issues', value: issuesDescription }]

        return { embed }
    },
    INFO: (description: string) => ({ embed: { description, color: 'F8F8FF' } }),
    ERROR: (description: string) => ({ embed: { description, color: 'B00020' } }),
    RESULTS: (bad: number, channels: number, good: number, total: number) => ({
        embed: {
            title: 'Invite check results',
            color: 'F8F8FF',
            fields: [
                { name: 'Check counts', value: [`Channels checked: ${ channels }`, `Invites checked: ${ total }`] },
                {
                    name: 'Stats',
                    value: [
                        `- ${ good }/${ total} good invites (${ (100 * good / total).toFixed(2) }% 🟢)`,
                        `- ${ bad }/${ total} bad invites (${ (100 * bad / total).toFixed(2) }% 🔴)`,
                    ]
                }
            ]
        }
    }),
    SUCCESS: (description: string) => ({ embed: { description, color: '00B020' } })
}

// [] = Optional
// <> = Required
export const MESSAGES = {
    COMMANDS: {
        CHECK: {
            DESCRIPTION: 'Runs an invite check on provided categories.',
            USAGE: 'check'
        },
        GUIDE: {
            DESCRIPTION: 'A guide to the bot.',
            USAGE: 'guide'
        },
        HELP: {
            DESCRIPTION: 'Displays all available commands, including information about a specific command or category.',
            USAGE: 'help [query]',
            EXAMPLES: ['help ping', 'help category']
        },
        IDS: {
            DESCRIPTION: 'Displays a list of all category IDs in a server.',
            USAGE: 'ids'
        },
        PING: {
            DESCRIPTION: 'Checks server latency.',
            USAGE: 'ping'
        },
        SETTINGS: {
            DESCRIPTION: 'Displays a guild\'s current settings.',
            USAGE: 'settings'
        },
        STATE: {
            DESCRIPTION: 'Displays status of invite check.',
            USAGE: 'state'
        },
        STATS: {
            DESCRIPTION: 'Displays bot information.',
            USAGE: 'stats'
        },
        SUPPORT: {
            DESCRIPTION: 'Gets the invite link for Sakura\'s support server.',
            USAGE: 'support'
        }
    },
    INFO: {
        NO_MATCH: EMBEDS.INFO('No match found.')
    },
    ERRORS: {

    },
    STATES: {
        
    }
}