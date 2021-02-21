import { Listener } from 'discord-akairo'
import { Constants, MessageEmbed, RateLimitData, TextChannel } from 'discord.js'
import pms from 'pretty-ms'

export default class RateLimitListener extends Listener {
    public constructor() {
        super(Constants.Events.RATE_LIMIT, {
            emitter: 'client',
            event: Constants.Events.RATE_LIMIT
        })
    }

    public async exec({ timeout, limit, timeDifference, method, path, route }: RateLimitData) {
        const logChannel = await this.client.channels.fetch(this.client.config.logChannelId) as TextChannel

        if (!logChannel)
            return

        const embed: Partial<MessageEmbed> = {
            color: 16753920,
            fields: [
                { inline: false, name: 'Timeout', value: pms(timeout ?? 0, { secondsDecimalDigits: 0 }) },
                { inline: false, name: 'Request limit', value: limit.toString() },
                { inline: false, name: 'Time Difference', value: pms(timeDifference ?? 0, { secondsDecimalDigits: 0 }) },
                { inline: false, name: 'HTTP method', value: method },
                { inline: false, name: 'Path', value: path },
                { inline: false, name: 'Route', value: route }
            ],
            timestamp: Date.now(),
            title: 'Rate limit hit!'
        }

        return logChannel.send(embed)
    }
}