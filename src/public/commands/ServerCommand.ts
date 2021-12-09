import { Message, MessageAttachment, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";

import { mcApi } from '../../services/api';
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ServerCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'server',
      aliases: ['ip'],
      description: 'Recebe informações sobre o servidor;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id);
    await mcApi(settings.ip).get('').then(async (response) => {
      if (response.data.status != 'error') {
        const attachment = new MessageAttachment(Buffer.from(response.data.favicon.split(",").slice(1).join(","), "base64"), "favicon.png");
        await sendMessageAndDelete(message.channel, new MessageEmbed()
          .attachFiles([attachment])
          .setThumbnail('attachment://favicon.png')
          .setDescription(`**Status do servidor:** \n Estamos com ${response.data.players.now}/${response.data.players.max} jogadores onlines em todos os servidores da rede. \n
          🎮 **IP:** \`${settings.ip}\`
          ⌚ **Tempo online**: \`${TimeFormatter.BR_TIMER.format(response.data.duration)}\` 
           \n **DICA!** Sempre é bom ter uma segurança, pegue seu pin gerado ao servidor para conseguir recuperar sua conta caso seja furtada ou roubada.`)
          .setColor(`#32a846`)
          , 10000);
      } else {
        await sendMessageAndDelete(message.channel, new MessageEmbed()
          .setDescription(`**Status do servidor:** \n \`\`Servidor offline\`\`, não conseguimos pegar as informações do servidor.\n\n 🎮 **IP:** \`${settings.ip}\` \n\n **DICA!** Sempre é bom ter uma segurança, pegue seu pin gerado ao servidor para conseguir recuperar sua conta caso seja furtada ou roubada.`)
          .setColor(`#ff0000`)
          , 10000);
      }

    }).catch(async (err) => {
      await sendMessageAndDelete(message.channel, new MessageEmbed()
        .setDescription(`**Status do servidor:** \n \`\`API Offline\`\`, não conseguimos pegar as informações do servidor.\n\n 🎮 **IP:** \`${settings.ip}\` \n\n **DICA!** Sempre é bom ter uma segurança, pegue seu pin gerado ao servidor para conseguir recuperar sua conta caso seja furtada ou roubada.`)
        .setColor(`#ff0000`)
        , 10000);
    })
  }

}