import { Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class PrefixCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "prefix",
      roles: ['ADMIN_PERM'],
      description: 'Altera o prefixo dos comandos do servidor;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);

    if (!args[0]) return message.reply(`🚫 Use: ${settings.commandPrefix}prefix <prefixo>.`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
    await message.channel.send(new MessageEmbed()
      .setThumbnail('https://i.imgur.com/jF1hPnt.png')
      .setAuthor(message.guild?.name, `${Bot.instance.client.user?.avatar ? Bot.instance.client.user?.avatar : "https://media3.giphy.com/media/chiLb8yx7ZD1Pdx6CF/giphy.gif"}`)
      .setDescription(`O prefixo dos comandos foi alterado de \`\`${settings.commandPrefix}\`\` para \`\`${args[0]}\`\`;`)
      .setFooter(`Prefixo alterado por ${message.author.username}`).setTimestamp(Date.now())
      .setColor(`#36393f`));
    cache.updateCache(message.guild?.id, {
      commandPrefix: args[0]
    }, true)

  }

}