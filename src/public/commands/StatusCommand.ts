import { Message, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import TimeFormatter from "../../utils/TimeFormatter";

export default class StatusCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'status',
      description: 'Envie uma mensagem de status do servidor;',
      roles: ['ADMIN_PERM']
    }
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id);
    if (args.length > 1) {
      const status = args.find(s => ['online', 'offline', 'manutenção'].includes(s.toLowerCase()));
      if (status) {
        message.channel.send(new MessageEmbed()
          .setTitle(`${settings.serverName} - Status`)
          .setColor('#00FFFF')
          .setDescription(`O status de um servidor foi alterado, confira a seguir as informações como, qual servidor, qual
         horário que o status foi enviado e qual o status atual do mesmo;
         \`\`\`Horário: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}\nServidor: ${args.slice(0, args.indexOf(status)).join(' ')}\nStatus: ${status}  \`\`\``))
      } else {
        return await message.channel.send(`🚫 Use: ${settings.prefix}status <Nome do servidor> <Online|Offline|Manutenção>.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
      }
    } else {
      return await message.channel.send(`🚫 Use: ${settings.prefix}status <Nome do servidor> <Online|Offline|Manutenção>.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
    }
  }
}