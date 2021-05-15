import { Command } from 'discord-akairo'
import type { CategoryChannel, Collection, GuildChannel, Message, MessageEmbed } from 'discord.js'
import { MESSAGES } from '../../utility/constants'

export default class CountsCommand extends Command {
    public constructor() {
        super('counts', {
            aliases: ['counts'],
            category: 'Admin',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.COUNTS.DESCRIPTION,
                usage: MESSAGES.COMMANDS.COUNTS.USAGE
            },
            userPermissions: ['ADMINISTRATOR']
        })
    }

    public async exec(message: Message) {
        const { guild }  = message
        const { categoryIds, ignoreIds } = this.client.config
        const guildChannels = message.guild.channels.cache
        const categories = guildChannels
            .filter(channel => categoryIds.includes(channel.id)) as Collection<string, CategoryChannel>
        const categoriesSorted = categories.sort((c1, c2) => c1.position - c2.position)
        const counts = (channels: Collection<string, GuildChannel>) => channels.reduce((obj, { id, type }) => {
            if (ignoreIds.includes(id))
                obj.ignored++
            if (['news', 'text'].includes(type))
                obj[type]++
            return obj
        }, { ignored: 0, news: 0, text: 0 })
        const embed: Partial<MessageEmbed> = {
            color: 0xF8F8FF,
            fields: categoriesSorted.map(({ children, name }) => {
                const { ignored, news, text } = counts(children)

                return {
                    inline: false,
                    name: `The "${ name }" category`,
                    value: `**${ news + text }** channels (**${ news }** announcement and **${ text }** text), with **${ ignored }** ignored`
                }
            }),
            footer: { text: `Ignored channels are not included in the channel count. The channel count is the number of channels ${ this.client.user.username } will check.` },
            title: `Channel counts for "${ guild.name }"`
        }

        return message.channel.send({ embed })
    }
}