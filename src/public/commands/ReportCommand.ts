import { Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ReportCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'denunciar',
      aliases: ['report'],
      description: 'Envie uma denúncia sobre um jogador para nossa equipe;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);


    const commandIssues = await new IssueManager(message.guild as Guild).finder().commandIssues(message, async (obj, objs) => {
      if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)) {
        objs.push('guilds.attendance');
        obj = Object.assign(obj, {
          guilds: {
            attendance: null
          }
        });
      } else {
        if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.mainReport)) {
          objs.push('channels.mainReport');
          obj = Object.assign(obj, {
            channels: {
              mainReport: null
            }
          });
        }
      }
    }, (settings: any) => {
      if (!settings.booleans.reports) {
        message.channel.send(`🚫 A criação de denúncias foi desabilitada por um superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
        return true;
      }

      return false;
    });

    if (commandIssues) return;

    const msg = await sendMessageAndDelete(message.channel, new MessageEmbed()
      .setAuthor(`${message.author.username}`, `https://media2.giphy.com/media/ME2ytHL362EbZksvCE/giphy.gif`)
      .setDescription(`Informe o nickname do jogador que deseja denúnciar.\nCaso forneça um nickname falso poderá ser punido!`), 20000);
    const collector = message.channel.createMessageCollector(a => a.author.id == message.author.id, { time: 1000 * 20, max: 2 });
    const report = {} as any;
    collector.on('collect', async (message) => {
      message.delete();
      if (!report.reported) {
        report.reported = message.content;
        await msg.edit(new MessageEmbed()
          .setAuthor(`${message.author.username}`, `https://media2.giphy.com/media/ME2ytHL362EbZksvCE/giphy.gif`).setColor('#fff312').setThumbnail(`https://minotar.net/avatar/${report.reported.replace(' ', '+')}`)
          .setDescription(`Jogador à ser denunciado: **${report.reported}**\n\nInforme agora um motivo ou prova para compor sua denúncia;\nNós aceitamos \`\`links, de imagens ou vídeos\`\` como provas.`))
      } else {
        report.reason = message.content;
        await msg.edit(new MessageEmbed()
          .setAuthor(`${message.author.username} - Denúncia completada!`, `https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/0/0f/Lime_Dye_JE2_BE2.png/150px-Lime_Dye_JE2_BE2.png?version=689addf38f5c21626ee91ec07e6e8670`).setColor('#00ff04').setThumbnail(`https://minotar.net/avatar/${report.reported.replace(' ', '')}`)
          .setDescription(`Jogador à ser denunciado: **${report.reported}**\nMotivo/prova da denúncia: **${report.reason}**\n\nSua denúncia foi criada com sucesso, em instantes ela será encaminhada para nossa equipe, onde ela será analisada.\n`).setFooter('Denúncia feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))

        const channel = Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.mainReport) as TextChannel;

        if (channel) {
          channel.send(new MessageEmbed()
            .setAuthor(`${message.author.username}#${message.author.discriminator} - Nova denúncia!`, `https://media0.giphy.com/media/geKGJ302nQe60eJnR9/giphy.gif`).setColor('#ff2a00').setThumbnail(`https://minotar.net/avatar/${report.reported.replace(' ', '+')}`)
            .setDescription(`|| @everyone ||\nJogador denunciado: **${report.reported}**\nMotivo/prova da denúncia: **${report.reason}**`).setFooter('Denúncia feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now()))).then(m => {
              m.react('✅')
              m.react('❌')
            })
        } else {
          sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${`Unknown main guild ID and channel ID.`}`, 5000)
        }
      }
    });
  }
}