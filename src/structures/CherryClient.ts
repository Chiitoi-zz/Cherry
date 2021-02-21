import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from 'discord-akairo'
import { config, CherryConfig } from '@constants'
import { Intents } from 'discord.js'
import PQueue from 'p-queue'
import { join } from 'path'

declare module 'discord-akairo' {
    interface AkairoClient {
        config: CherryConfig
        queue: PQueue
    }
}

export default class CherryClient extends AkairoClient {
    public config: CherryConfig
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
        interval: config.interval,
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
    }

    public async start() {
        await this.init()
        await this.login(this.config.token)
    }
}