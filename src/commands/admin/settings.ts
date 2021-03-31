import { MESSAGES } from '@constants'
import { formatInterval } from '@utils'
import { Command } from 'discord-akairo'
import type { Message, MessageEmbed } from 'discord.js'
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
        const guild = message.guild!
        const guildChannels = guild.channels.cache
            .sort((c1, c2) => c1.position - c2.position)
        const { botChannelIds, categoryIds, checkChannelId, ignoreIds, interval, logChannelId, prefix } = this.client.config
        const { bots, categories, checkChannel, ignore, logChannel } = guildChannels.reduce((acc, channel, channelId) => {
            if (botChannelIds.includes(channelId))
                acc.bots.push(channel)
            if (categoryIds.includes(channelId))
                acc.categories.push(channel)
            if (checkChannelId == channelId)
                acc.checkChannel = channel
            if (ignoreIds.includes(channelId))
                acc.ignore.push(channel)
            if (logChannelId == channelId)
                acc.logChannel = channel
            return acc
        }, { bots: [], categories: [], checkChannel: null, ignore: [], logChannel: null })
        const embed: Partial<MessageEmbed> = {
            color: 16316671,
            fields: [
                { inline: false, name: 'Bot prefix', value: `\`${ prefix }\`` },
                { inline: false, name: 'Invite check channel', value: checkChannel ?? 'No channel set.' },
                { inline: false, name: 'Category list', value: categories.length ? categories.map(({ name }) => `The "${ name }" category`) : 'No added categories.' },
                { inline: false, name: 'Ignore list', value: ignore.length ? ignore : 'No ignored channels.' },
                { inline: false, name: 'Bot channel list', value: bots.length ? bots : 'No added bot channels.' },
                { inline: false, name: 'Log channel', value: logChannel ?? 'No channel set.' },
                { inline: false, name: 'Interval', value: `1 request every ${ pms(formatInterval()) }`}
            ],
            title: `${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } settings for "${ guild.name }"`
        }

        return message.channel.send({ embed })
    }
}