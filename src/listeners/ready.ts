import { formatStatus, validate } from '@utils'
import { Listener } from 'discord-akairo'
import { Constants, PresenceData } from 'discord.js'

export default class ReadyListener extends Listener {
    public constructor() {
        super(Constants.Events.CLIENT_READY, {
            emitter: 'client',
            event: Constants.Events.CLIENT_READY
        })
    }

    public async exec() {
        await validate(this.client)

        const status = formatStatus()
        const presenceData: Partial<PresenceData> = { status: this.client.config.presenceStatus }

        if (status.length)
            presenceData.activity = { name: status[0].name, type: status[0].type }

        await this.client.user.setPresence(presenceData)

        console.log(`\n${ this.client.user.tag } is online!`)
    }
}