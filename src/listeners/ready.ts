import { validate } from '@utils'
import { Listener } from 'discord-akairo'
import { Constants } from 'discord.js'
import { stat } from 'node:fs'

export default class ReadyListener extends Listener {
    public constructor() {
        super(Constants.Events.CLIENT_READY, {
            emitter: 'client',
            event: Constants.Events.CLIENT_READY
        })
    }

    public async exec() {
        const statuses = validate(this.client)
        
        if (statuses.length == 1)
            this.client.user.setActivity(statuses[0].name, { type: statuses[0].type })
        if (statuses.length > 1) {
            let index = 0
            this.client.setInterval(() => {
                const { name, type } = statuses[index]
                this.client.user.setActivity(name, { type })

                if (index == statuses.length - 1)
                    index = 0
                else
                    index++
            }, 600000)
        }
        
        console.log(`${ this.client.user.tag } is online!`)
    }
}