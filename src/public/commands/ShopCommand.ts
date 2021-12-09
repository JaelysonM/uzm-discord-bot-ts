import { Message, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";

import { sendMessageAndDelete } from "../../utils/MessageUtils";

export default class ServerCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'loja',
      aliases: ['shop'],
      description: 'Link da loja do servidor.'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id);
    await sendMessageAndDelete(message.channel, new MessageEmbed()
      .setDescription(`*Loja do servidor*: ${settings.shop}`)
      .setColor(`#ffff`)
      , 10000);
  }

}