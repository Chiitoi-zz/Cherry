import { MESSAGES } from '@constants'
import { format } from '@utils'
import { Command } from 'discord-akairo'
import type { Message, MessageEmbed } from 'discord.js'

export default class PingCommand extends Command {
    public constructor() {
        super('ping', {
            aliases: ['ping'],
            category: 'Utility',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.PING.DESCRIPTION,
                usage: MESSAGES.COMMANDS.PING.USAGE
            }
        })
    }

    public async exec(message: Message) {
        const sent = await message.channel.send('Pong!')
        const ping = sent.createdTimestamp - message.createdTimestamp
        const embed: Partial<MessageEmbed> = {
            color: 16316671,
            description: `🔂 **RTT**: ${ format(ping) } ms\n💟 **Heartbeat**: ${ Math.round(this.client.ws.ping) } ms`
        }
        
        return sent.edit('', { embed })
    }
}