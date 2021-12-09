import { Guild, MessageEmbed, TextChannel } from "discord.js";
import Bot from "../containers/Bot";
import IssueManager from "../managers/IssueManager";
import TimeFormatter from "../utils/TimeFormatter";

export type LogType = | 'autoRole' | 'unmute' | 'configured' | 'dashboard' | 'ticketEnd'

export default async function log(guild: Guild, log: LogType, description: string) {
  try {
    const settings = await Bot.fromHandler('settings').getCache(guild.id);
    const commandIssues = await new IssueManager(guild as Guild).finder().issues(async (obj, objs) => {
      if (!Bot.instance.client.guilds.cache.get(settings.guilds.attendance)?.channels.cache.get(settings.channels.logs)) {
        objs.push('channels.logs');
        obj = Object.assign(obj, {
          channels: {
            logs: null
          },
        });
      }
    });

    if (commandIssues) return;
    const channel = Bot.instance.client.guilds.cache.get(settings.guilds.attendance)?.channels.cache.get(settings.channels.logs) as TextChannel;
    if (channel) {
    }
    switch (log) {
      case 'autoRole':
        channel.send(new MessageEmbed()
          .setAuthor(`Aplicação de cargo automática - [LOG]`, `https://i.imgur.com/vMAGl44.gif`).setColor('#fcfcfc')
          .setDescription(`Ocorreu uma aplicação de cargo automática utilizando o processo de formulários!
          
          Mais detalhes da ação abaixo:
          \`\`\`${description}\`\`\``).setFooter('Ação feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
        break;
      case 'unmute':
        channel.send(new MessageEmbed()
          .setAuthor(`Cargo de silenciamento removido - [LOG]`, `https://i.imgur.com/vMAGl44.gif`).setColor('#fcfcfc')
          .setDescription(`Ocorreu uma remoção do cargo de silenciado por alguém!
            
            Mais detalhes da ação abaixo:
            \`\`\`${description}\`\`\``).setFooter('Ação feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
        break;
      case 'configured':
        channel.send(new MessageEmbed()
          .setAuthor(`Servidor configurado pelo /register - [LOG]`, `https://i.imgur.com/vMAGl44.gif`).setColor('#fcfcfc')
          .setDescription(`Um superior utilizou o /register para configurar inicialmente o servidor!
              
              Mais detalhes da ação abaixo:
              \`\`\`${description}\`\`\``).setFooter('Ação feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
        break;
      case 'dashboard':
        channel.send(new MessageEmbed()
          .setAuthor(`Dashboard utilizado - [LOG]`, `https://i.imgur.com/vMAGl44.gif`).setColor('#fcfcfc')
          .setDescription(`Um superior utilizou o dashboard para configuração.
                
                Mais detalhes da ação abaixo:
                \`\`\`${description}\`\`\``).setFooter('Ação feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
        break;
      case 'ticketEnd':
        channel.send(new MessageEmbed()
          .setAuthor(`Ticket encerrado - [LOG]`, `https://i.imgur.com/vMAGl44.gif`).setColor('#fcfcfc')
          .setDescription(`Um superior encerrou um ticket de um jogador.
                  
                  Mais detalhes da ação abaixo:
                  \`\`\`${description}\`\`\``).setFooter('Ação feita em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
        break;

    }
  } catch (err) { }

}