import { EMBEDS, MESSAGES } from '@constants'
import { extractCodes, handle, processResults } from '@utils'
import { Command } from 'discord-akairo'
import { CategoryChannel, Collection, Message, NewsChannel, TextChannel } from 'discord.js'

export default class CheckCommand extends Command {
    public constructor() {
        super('check', {
            aliases: ['check'],
            category: 'Invites',
            channel: 'guild',
            description: {
                text: MESSAGES.COMMANDS.CHECK.DESCRIPTION,
                usage: MESSAGES.COMMANDS.CHECK.USAGE
            },
            userPermissions: ['ADMINISTRATOR']
        })
    }

    public async exec(message: Message) {        
        const guild = message.guild!
        const guildChannels = guild.channels.cache
        const { config: { categoryIds, checkChannelId, ignoreIds, interval }, inCheck } = this.client
        const checkChannel = guildChannels.get(checkChannelId)

        if (!(checkChannel instanceof TextChannel))
            return message.channel.send(MESSAGES.ERRORS.CHECK_CHANNEL)
        if (checkChannelId !== message.channel.id)
            return message.channel.send(MESSAGES.INFO.WRONG_CHANNEL(checkChannel))
        if (inCheck)
            return message.channel.send(MESSAGES.INFO.IN_CHECK)
        if (!categoryIds.length)
            return message.channel.send(MESSAGES.INFO.NO_CATEGORIES)

        const categories = guildChannels
            .filter(({ id, type }) => type === 'category' && categoryIds.includes(id))
            .sort((c1, c2) => c1.position - c2.position) as Collection<string, CategoryChannel>

        const delay = ms => new Promise(res => setTimeout(res, ms))
        const delayTask = () => delay(interval)
        const messagesTask = (channel: NewsChannel | TextChannel) => () => handle(channel.messages.fetch({ limit: 8 }, true, false))
        const inviteTask = (code: string) => () => handle(this.client.fetchInvite(code))

        this.client.inCheck = true
        checkChannel.send(MESSAGES.INFO.CHECK_START(this.client.user.username))
        let goodInvites = 0, badInvites = 0, totalChannels = 0, totalInvites = 0

        for (const [_, category] of categories) {
            const categoryName = category.name
            const childChannels = category.children
                .filter(({ id, type }) => ['news', 'text'].includes(type) && !ignoreIds.includes(id)) as Collection<string, NewsChannel | TextChannel>

            if (!childChannels.size) {
                message.util.send(EMBEDS.CATEGORY(categoryName))
                continue
            }

            const categoryResults: Collection<string, { code: string, valid: boolean }[]> = new Collection()
            const issues: { unknown: number, known: (NewsChannel | TextChannel)[] } = { unknown: 0, known: [] }
            const childChannelsSorted = childChannels.sort((c1, c2) => c1.position - c2.position)

            for (const [channelId, channel] of childChannelsSorted) {
                if (!channel) {
                    issues.unknown++
                    continue
                }

                const messages = await this.client.queue.add(messagesTask(channel))
                this.client.queue.add(delayTask)

                if (!messages[0]) {
                    issues.known.push(channel)
                    continue
                }

                const codes = extractCodes(messages[0])

                if (!codes.length) {
                    categoryResults.set(channelId, [])
                    continue
                }

                const codePromises = codes.map(code => inviteTask(code))
                const invites = await Promise.allSettled(codePromises.map(codePromise => this.client.queue.add(codePromise))) // invites = { status: 'fulfilled', value: [ [Invite], [DiscordAPIError] ] }[]
                const results = invites.map((invite, index) => {
                    const { value } = invite as any
                    
                    return { code: codes[index], valid: !!value[0] }
                })

                categoryResults.set(channelId, results)
            }

            const { bad, channels, good, issuesDescription, resultsDescription, total } = processResults(categoryResults, issues)

            badInvites += bad
            goodInvites += good
            totalChannels += channels
            totalInvites += total

            checkChannel.send(EMBEDS.CATEGORY(categoryName, resultsDescription, issuesDescription))
        }

        checkChannel.send(MESSAGES.INFO.CHECK_COMPLETE)
        checkChannel.send(EMBEDS.RESULTS(badInvites, totalChannels, goodInvites, totalInvites))
        this.client.inCheck = false
    }
}