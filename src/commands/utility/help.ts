import { MESSAGES } from '@constants'
import { Argument, Category, Command } from 'discord-akairo'
import type { Collection, Message, MessageEmbed } from 'discord.js'

export default class HelpCommand extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', 'h'],
            args: [
                {
                    id: 'query',
                    type: Argument.union(
                        'command',
                        (_, phrase: string) => this.handler.findCategory(phrase),
                        (_, phrase: string) => phrase ? null : this.handler.categories
                    )
                }
            ],
            category: 'Utility',
            channel: 'guild',
            description: {
                examples: MESSAGES.COMMANDS.HELP.EXAMPLES,
                text: MESSAGES.COMMANDS.HELP.DESCRIPTION,
                usage: MESSAGES.COMMANDS.HELP.USAGE
            }
        })
    }

    public async exec(message: Message, { query }: { query: Command | Category<string, Command> | Collection<string, Category<string, Command>> | null }) {
        const prefix = this.client.config.prefix

        if (!query)
            return message.channel.send(MESSAGES.INFO.NO_MATCH)

        let embed: Partial<MessageEmbed>

        if (query instanceof Command) {
            const { id, categoryID, description: { examples, text, usage }, aliases } = query
            
            embed = {
                color: 16316671,
                fields: [
                    { inline: false, name: 'Category', value: categoryID },
                    { inline: false, name: 'Description', value: text },
                    { inline: false, name: 'Usage', value: `\`${ prefix }${ usage }\``}
                ],
                footer: { text: 'Optional - [] | Required - <>' },
                title: `The "${ prefix }${ id }" command`
            }

            if (examples)
                embed.fields.push({ inline: false, name: 'Examples', value: examples.map(example => `\`${ prefix }${ example }\``) })
            if (aliases?.length)
                embed.fields.push({ inline: false, name: 'Aliases', value: aliases.map(alias => `\`${ prefix }${ alias }\``).join('\n') })
        } else if (query instanceof Category) {
            embed = {
                color: 16316671,
                description: query.map(command => `\u2022 \`${ prefix }${ command.id }\` - ${ command?.description?.text }`).join('\n'),
                title: `The "${ query.id }" category`,
            }
        } else {
            embed = {
                color: 16316671,
                fields: query.map(category => ({
                    inline: false,
                    name: category.id,
                    value: category.map(command => `\u2022 \`${ prefix }${ command.id }\` - ${ command?.description?.text }`).join('\n')
                })),
                title: `${ this.client.user.username}'s commands`
            }
        }

        return message.channel.send({ embed })
    }
}

