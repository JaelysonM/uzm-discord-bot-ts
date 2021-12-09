import { Guild, Message, MessageEmbed } from "discord.js";
import Account from "../../containers/Account";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import { delay } from "../../utils/Functions";
import { sendMessageAndDelete } from "../../utils/MessageUtils";

export default class HelpCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "ajuda",
      aliases: ['help']
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {

    const helpMessage = await sendMessageAndDelete(message.channel, new MessageEmbed()

      .setTitle(`Este processo pode demorar alguns segundos`).setThumbnail(`https://media0.giphy.com/media/Tk25o3pwpdbQqUS8Ht/giphy.gif`)
      .setDescription(`O sistema está coletando suas permissões para conseguir definir quais comandos você pode usar no servidor.`)
      .setColor(`#36393f`), 10000);
    const cache = SettingsCache.instance();

    const settings = await cache.getCache(message.guild?.id as string);
    await delay(730);
    const lowestRole = message.guild?.roles.cache.find(r => r.id == settings.roles.lowerStaff);
    const account = new Account(message.author, message.guild as Guild, settings);
    helpMessage.edit(message.author, new MessageEmbed()
      .setTitle(`Confira os comandos disponíveis para você!`)
      .setDescription(`O sistema coletou que você tem permissões especificas, com isso você tem acesso aos comandos ${lowestRole || message.member?.hasPermission('ADMINISTRATOR') ? `de moderação` : `básicos`}. Confira-os: \n\n${account.listCommandsLabel()}`)
      .setColor(`#36393f`));
  }

}