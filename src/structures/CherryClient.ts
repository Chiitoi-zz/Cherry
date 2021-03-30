import { config, CherryConfig } from '@constants'
import { formatInterval } from '@utils'
import chalk from 'chalk'
import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo'
import { Intents } from 'discord.js'
import { join } from 'path'
import PQueue from 'p-queue'

declare module 'discord-akairo' {
    interface AkairoClient {
        config: CherryConfig
        inCheck: boolean
        queue: PQueue
    }
}

export default class CherryClient extends AkairoClient {
    public config: CherryConfig
    public inCheck: boolean
    public commandHandler = new CommandHandler(this, {
        directory: join(__dirname, '..', 'commands'),
        prefix: config.prefix,
        aliasReplacement: /-/g,
        allowMention: true,
        commandUtil: false,
        commandUtilLifetime: 30000,
        commandUtilSweepInterval: 90000,
        handleEdits: false
    })
    public inhibitorHandler: InhibitorHandler = new InhibitorHandler(this, { directory: join(__dirname, '..', 'inhibitors') })
    public listenerHandler: ListenerHandler = new ListenerHandler(this, { directory: join(__dirname, '..', 'listeners') })
    public queue = new PQueue({
        autoStart: true,
        concurrency: 1,
        interval: formatInterval(),
        intervalCap: 1
    })
    public constructor() {
        super(
            {},
            {
                disableMentions: 'everyone',
                messageCacheLifetime: 3600,
                messageCacheMaxSize: 10,
                messageSweepInterval: 2700,
                messageEditHistoryMaxSize: 0,
                ws: {
                    intents: [
                        Intents.FLAGS.GUILDS,
                        Intents.FLAGS.GUILD_MESSAGES
                    ]
                }
            }
        )
        
        this.config = config
        this.inCheck = false
    }

    private async init() {
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler)
        this.commandHandler.useListenerHandler(this.listenerHandler)
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler
        })

        this.commandHandler.loadAll()
        this.inhibitorHandler.loadAll()
        this.listenerHandler.loadAll()

        if (this.config?.debug) {
            console.log(chalk`{bold.underline ${ 'Provided config' }}`)
            console.log(this.config, '\n')
        }
    }

    public async start() {
        await this.init()
        await this.login(this.config.token)
    }
}