import { formatStatus, validate } from '@utils'
import { Listener } from 'discord-akairo'
import { Constants } from 'discord.js'

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

        if (status.length)
            this.client.user.setActivity(status[0].name, { type: status[0].type })

        console.log(`\n${ this.client.user.tag } is online!`)
    }
}