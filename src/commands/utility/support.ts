import { MESSAGES } from '@constants'
import { Command } from 'discord-akairo'
import type { Message } from 'discord.js'

export default class PingCommand extends Command {
    public constructor() {
        super('support', {
            aliases: ['support'],
            category: 'Utility',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.SUPPORT.DESCRIPTION,
                usage: MESSAGES.COMMANDS.SUPPORT.USAGE
            }
        })
    }

    public exec(message: Message) {
        return message.channel.send('Join the support server for Sakura! - https://discord.gg/wtZurTFJdH')
    }
}