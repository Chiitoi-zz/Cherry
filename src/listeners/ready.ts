import { formatStatuses, validate } from '@utils'
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
        if (this.client.config.validate)
            await validate(this.client)

        const statuses = formatStatuses()
        const presenceData: Partial<PresenceData> = { status: this.client.config.presenceStatus }
        
        if (statuses.length == 1) {
            presenceData.activity = { name: statuses[0].name, type: statuses[0].type }

            await this.client.user.setPresence(presenceData)
        }
        if (statuses.length > 1) {
            let index = 0
            this.client.setInterval(() => {
                const { name, type } = statuses[index]
                
                presenceData.activity = { name, type }

                this.client.user.setPresence(presenceData)

                if (index == statuses.length - 1)
                    index = 0
                else
                    index++
            }, 600000)
        }
        
        console.log(`\n${ this.client.user.tag } is online!`)
    }
}