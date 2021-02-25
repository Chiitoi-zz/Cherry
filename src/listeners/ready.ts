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
        const result = validate(this.client)

        // if (typeof result === 'boolean')
        //     process.exit(0)

        // const { name, type } = result
        // await this.client.user.setActivity(name, { type })
        console.log(`${ this.client.user.tag } is online!`)
    }
}