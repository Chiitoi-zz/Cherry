import { validate } from '@utils'
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
        validate(this.client)
        console.log(`\n${ this.client.user.tag } is online!`)
    }
}