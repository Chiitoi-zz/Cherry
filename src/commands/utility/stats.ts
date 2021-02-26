import { MESSAGES } from '@constants'
import { format } from '@utils'
import { Command } from 'discord-akairo'
import type { Message, MessageEmbed } from 'discord.js'
import pms from 'pretty-ms'

export default class StatsCommand extends Command {
    public constructor() {
        super('stats', {
            aliases: ['stats'],
            category: 'Utility',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.STATS.TEXT,
                usage: MESSAGES.COMMANDS.STATS.USAGE
            }
        })
    }

    public exec(message: Message) {
        const botName = this.client.user.username
        const embed: Partial<MessageEmbed> = {
            author: {
                iconURL: this.client.user.displayAvatarURL(),
                name: `${ botName } v${ process.env.npm_package_version ?? process.env.version }`
            },
            color: 16316671,
            fields: [
                { inline: false, name: 'Developer', value: 'Flare#2851' },
                { inline: false, name: 'Source', value: `[${ botName }${ botName.toLowerCase().endsWith('s') ? '\'' : '\'s' } code](https://github.com/Chiitoi/Cherry)` },
                {
                    inline: false,
                    name: 'Random stuff',
                    value: [
                        `**Uptime:** ${ pms(this.client.uptime ?? 0, { secondsDecimalDigits: 0 }) }`,
                        `**Memory Usage:** ${ format((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)) } MB`
                    ].join('\n')
                }
            ]
        }

        return message.channel.send({ embed })
    }
}