import { MESSAGES } from '@constants'
import { Command } from 'discord-akairo'
import type { GuildChannel, Message, MessageEmbed } from 'discord.js'
import pms from 'pretty-ms'

export default class SettingsCommand extends Command {
    public constructor() {
        super('settings', {
            aliases: ['settings'],
            category: 'Admin',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.SETTINGS.TEXT,
                usage: MESSAGES.COMMANDS.SETTINGS.USAGE
            },
            userPermissions: ['ADMINISTRATOR']
        })
    }

    public async exec(message: Message) {
        const botName = this.client.user.username
        const { botChannelIds, categoryIds, checkChannelId, ignoreIds, interval, logChannelId, prefix, serverIds } = this.client.config
        const channelCache = this.client.channels.cache
        const checkChannel = channelCache.get(checkChannelId)
        const logChannel = channelCache.get(logChannelId)
        const guildsSorted = this.client.guilds.cache.sort((g1, g2) => g1.createdTimestamp - g2.createdTimestamp)
        const botEmbed: Partial<MessageEmbed> = {
            color: 16316671,
            description: [
                `**Bot prefix:** \`${ prefix }\``,
                `**Interval:** 1 request every ${ pms(interval) }`,
                `**Invite check channel:** ${ checkChannel ?? 'No channel set.' }`,
                `**Log channel:** ${ logChannel ?? 'No channel set.' }`
            ].join('\n'),
            title: `${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } main settings`
        }

        await message.channel.send({ embed: botEmbed })

        for (const [guildId, guild] of guildsSorted) {
            if (!serverIds.includes(guildId))
                continue

            const guildChannels = guild.channels.cache.sort((c1, c2) => c1.position - c2.position)
            const { bots, categories, ignore } = guildChannels.reduce((acc, channel, channelId) => {
                if (botChannelIds.includes(channelId))
                    acc.bots.push(channel)
                if (categoryIds.includes(channelId))
                    acc.categories.push(channel)
                if (ignoreIds.includes(channelId))
                    acc.ignore.push(channel)
                return acc
            }, { bots: [], categories: [], ignore: [] })
            const embed: Partial<MessageEmbed> = {
                color: 16316671,
                fields: [
                    { inline: false, name: 'Category list', value: categories.length ? categories.map(({ name }) => `The "${ name }" category`).join('\n') : 'No added categories.' },
                    { inline: false, name: 'Ignore list', value: ignore.length ? ignore.join('\n') : 'No ignored channels.' },
                    { inline: false, name: 'Bot channel list', value: bots.length ? bots.join('\n') : 'No added bot channels.' },
                ],
                title: `${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } settings for "${ guild.name }"`
            }

            await message.channel.send({ embed })
        }
    }
}