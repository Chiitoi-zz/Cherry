import { MESSAGES } from '@constants'
import { Command } from 'discord-akairo'
import type { Message, MessageEmbed } from 'discord.js'

export default class GuideCommand extends Command {
    public constructor() {
        super('guide', {
            aliases: ['guide'],
            category: 'Utility',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.GUIDE.TEXT,
                usage: MESSAGES.COMMANDS.GUIDE.USAGE
            }
        })
    }

    public exec(message: Message) {
        const embed: Partial<MessageEmbed> = {
            color: 16316671,
            description: [
                '[Linux Guide](https://github.com/Chiitoi/Cherry/wiki/Linux-Guide)',
                '[macOS Guide](https://github.com/Chiitoi/Cherry/wiki/macOS-Guide)',
                '[Windows Guide](https://github.com/Chiitoi/Cherry/wiki/Windows-Guide)'
            ].join('\n'),
            title: 'Self-host guides'
        }

        return message.channel.send({ embed })
    }
}