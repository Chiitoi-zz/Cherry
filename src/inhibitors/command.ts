import { Inhibitor } from 'discord-akairo'
import type { Message } from 'discord.js'

export default class CommandInhibitor extends Inhibitor {
    public constructor() {
        super('command', {
            reason: 'Command used in non-whitelisted channel.'
        })
    }

    public exec(message: Message) {
        const { channel: { id: channelId }, guild: { id: guildId }, member: { permissions } } = message
        const isAdmin = permissions.has('ADMINISTRATOR')
        const { botChannelIds: list, serverIds } = this.client.config
        const inList = list.includes(channelId)

        if (!serverIds.includes(guildId))
            return true
        if (message.mentions.everyone)
            return true
        if (!isAdmin && !inList)
            return true
        return false
    }
}