import { Guild, GuildMember, Message, MessageEmbed, TextChannel } from "discord.js";
import Bot from "../../containers/Bot";
import { PunishData } from "../../containers/Punish";
import Registration from "../../containers/Registration";
import AccountCache from "../../database/cache/AccountCache";
import SettingsCache from "../../database/cache/SettingsCache";
import { ActionsEnum } from "../../handlers/CacheHandler";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { isNumber } from "../../utils/Functions";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";
import TimeUnit from "../../utils/TimeUnit";


export default class PunishCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "punir",
      roles: ['ADMIN_PERM'],
      description: 'Abre um painel de punição de membros;'
    };
  }




  punishById = (id: any, punishes: any) => punishes[id];

  punishesEmbedList = (punishes: Object[]) => Object.values(punishes).map((item: PunishData, index) => ` ${formatNumber((index + 1))} » ${item.name}`).join('\n')


  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);
    let silent = false;
    let member = message.mentions.members?.first() as GuildMember;
    const commandIssues = await new IssueManager(message.guild as Guild).finder().commandIssues(message, async (obj, objs) => {
      if (!message.guild?.roles.cache.find(r => r.id == settings.roles.muted)) {
        objs.push('roles.muted');
        obj = Object.assign(obj, {
          roles: {
            muted: null
          }
        });
      } if (!message.guild?.channels.cache.find(c => c.id == settings.channels.punish)) {
        objs.push('channels.punish');
        obj = Object.assign(obj, {
          channels: {
            punish: null
          }
        });
      }
    }, (settings: any) => {
      if (settings.type != 'PRINCIPAL') {
        sendMessageAndDelete(message.channel, `Comando exclusivo para o servidor principal!`, 2000);
        return true;
      }

      if (!member) {
        sendMessageAndDelete(message.channel, `Necessito de um usuário para punir!`, 2000);
        return true;
      }

      return false;
    });

    if (commandIssues) return;


    const account = await Bot.fromHandler('account').getCache(`${message.author.id}-${message.guild?.id as string}`);
    if (args.length == 2) silent = args[1].includes('-s') ? true : false;
    if (args.length > 2) silent = args[2].includes('-s') ? true : false;
    if (account.muteTimestamp != 0 && Date.now() > account.muteTimestamp) member.roles.remove(settings.roles.muted)

    try {
      const msg = await sendMessageAndDelete(message.channel, new MessageEmbed().setTitle(`${silent ? `🔕 __Modo silencioso__` : ''}`)
        .setDescription(`Você deve escolher um dos motivos abaixo para confirmar a punição ao membro, basta copiar o ID do motivo e enviar neste canal de texto.\n\n \`\`\`${this.punishesEmbedList(settings.punishes)}\`\`\`\ \nEnvie \`cancelar\` para cancelar a ação que o comando causará sobre o membro, deste modo a punição não será aplicada!`), TimeUnit.SECONDS.toMillis(15))
      const collector = msg.channel.createMessageCollector(a => a.author.id == message.author.id, { time: 10000 * 50, max: 1 });
      collector.on('collect', async (message) => {
        const content = message.content;
        if (content.toLowerCase() != 'cancelar') {
          const punish = this.punishById(parseInt(content.toLowerCase()), settings.punishes);
          if (!isNumber(content.toLowerCase()) || (parseInt(content.toLowerCase()) > Object.keys(settings.punishes).length) || parseInt(content.toLowerCase) < 0 || !punish) {
            message.delete();
            return;
          }
          if (!silent)
            message.guild.channels.cache.get(settings.channels.punish).send(new MessageEmbed()
              .setDescription(`Um membro foi punido do servidor de discord recentemente, confira abaixo algumas informações sobre a punição, dentre elas quem aplicou, motivo e membro punido.\n⠀\`\`\`\ Membro punido: ${member.user.tag} \n Motivo da punição: ${punish.name} \n Punição aplicada por: ${message.author.tag} \`\`\`\ `)
              .setFooter('A punição foi aplicada ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())));
          sendMessageAndDelete(message.channel, new MessageEmbed()
            .setAuthor(`Motivo aplicado com sucesso!`, `https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/0/0f/Lime_Dye_JE2_BE2.png/150px-Lime_Dye_JE2_BE2.png?version=689addf38f5c21626ee91ec07e6e8670`)
            .setDescription(`\nVocê selecionou o motivo \`\`${punish.name}\`\`, o mesmo foi punido com um silenciamento de ${TimeFormatter.BR_TIMER.format(punish.timestamp).trim()}.\n\nCaso se repita o mesmo será punido com o banimento permanente do servidor.`).setFooter(`Essa sua ${(account.punishTimes + 1)}º punição.`), 5000);
          member.roles.add(settings.roles.muted);
          await Bot.fromHandler('account').updateCache(`${message.author.id}-${message.guild?.id as string}`, {
            muteTimestamp: punish.timestamp + Date.now(),
            punishTimes: {
              action: ActionsEnum.ADDICTION,
              value: 1
            }
          }, true);
        } else {
          collector.stop();
          await msg.delete().then(() => { }).catch((err) => { });
          return message.channel.send(`Você cancelou a punição sobre o usuário!`)
        }
      });
    } catch (err) {
      console.log(err)
      sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${`Unknown main guild ID and channel ID.`}`, 5000)
    }
  }

}

function formatNumber(number: number) {
  return number < 10 ? `0${number}` : number;
}