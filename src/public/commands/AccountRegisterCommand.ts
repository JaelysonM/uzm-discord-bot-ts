import { Message, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import Captcha from "../../containers/Captcha";
import Ticket from "../../containers/Ticket";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { mineTools } from "../../services/api";
import { sendMessageAndDelete } from "../../utils/MessageUtils";

export default class HelpCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "registrar",
      aliases: ['help'],
      description: "Registra um nickname do Minecraft em sua conta do Discord.",
      internal: true
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    if (!Captcha.get(message.author.id)) {
      await sendMessageAndDelete(message.channel, `Comando não disponível para você, não há uma verificação pendente.`, 2000);
      return;
    }
    if (Ticket.get(message.author.id)) {
      await sendMessageAndDelete(message.channel, `Comando não disponível para você, você está em um ticket.`, 2000);
      return;
    }
    const guild = Captcha.get(message.author.id).guild;
    const settings = await cache.getCache(guild.id as string);

    const issueManager = new IssueManager(guild);
    const commandIssues = await issueManager.finder().commandIssues(message, async (obj, objs) => {

    }, (settings: any) => {
      if (settings.type != 'PRINCIPAL') {
        sendMessageAndDelete(message.channel, `Comando exclusivo para o servidor principal!`, 2000);
        return true;
      }
      if (settings.captchaType != 'advanced') {
        sendMessageAndDelete(message.channel, `Comando não disponível para essa configuração de servidor.`, 2000);
        return true;
      }
      return false;
    });

    if (commandIssues) return;

    if (Captcha.get(message.author.id)) {
      if (!args[0]) return message.reply(`🚫 Use: ${settings.commandPrefix}registrar <Nickname>.`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })

      const nickname = (await Bot.fromHandler('account').list(false) as Object[]).filter((d: any) => d.data.minecraft.nickname).filter((d: any) => {
        return d.data.minecraft.nickname.toLowerCase() == args[0].toLowerCase();
      });
      if (nickname.length == 0) {
        await sendMessageAndDelete(message.channel, new MessageEmbed()
          .setAuthor(`Sua conta foi registrada com sucesso.`, `https://i.imgur.com/lazHzIj.gif`).setColor(`#07e5ed`).setThumbnail(`https://mc-heads.net/combo/${args[0]}`).
          setDescription(`<@${message.author.id}> registrou o nickname \`\`${args[0]}\`\`.
            
            `).setFooter(`${settings.name} - Sistema de registro`), 6000);
        let nickname = args[0];
        let uuid = null;
        try {
          const response = await mineTools(args[0]).get('');
          nickname = response.data.name;
          uuid = response.data.id;
        } catch (err) { }
        try {
          await Captcha.get(message.author.id).member.setNickname(`! ${nickname}`)
        } catch (err) {
        }
        Captcha.get(message.author.id).computeCaptcha(settings);
        await Bot.fromHandler('account').updateCache(`${message.author.id}-${guild.id}`, {
          minecraft: {
            nickname,
            uuid,
          }
        }, true);
      } else {
        await sendMessageAndDelete(message.channel, new MessageEmbed()
          .setAuthor(`Conta já registrada!`, `https://i.imgur.com/o5RTi2H.gif`).setColor(`#07e5ed`).
          setDescription(`**${args[0]}** já foi registado por um jogador.`).setFooter(`${settings.name} - Sistema de registro`), 6000);
      }
    }
  }
}