import { Inhibitor } from 'discord-akairo'
import type { Message } from 'discord.js'

export default class CommandInhibitor extends Inhibitor {
    public constructor() {
        super('command', {
            reason: 'Command used in non-whitelisted channel.'
        })
    }

    public exec(message: Message) {
        const { channel: { id: channelId }, member } = message
        const isAdmin = member!.permissions.has('ADMINISTRATOR')
        const list = this.client.config.botChannelIds
        const inList = list.includes(channelId)

        if (message.mentions.everyone)
            return true
        if (!isAdmin && !inList)
            return true
        return false  
    }
}