import { Guild, Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ReviewCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "revisar",
      roles: ['ADMIN_PERM'],
      description: 'Responda a o pedido de revisão de um jogador;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);


    const commandIssues = await new IssueManager(message.guild as Guild).finder().commandIssues(message, async (obj, objs) => {
      if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.main)) {
        objs.push('guilds.main');
        obj = Object.assign(obj, {
          guilds: {
            main: null
          }
        });
      } else {
        if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.main)?.channels.cache.find(c => c.id == settings.channels.appel)) {
          objs.push('channels.appel');
          obj = Object.assign(obj, {
            channels: {
              appel: null
            }
          });
        }
      }
    }, (settings: any) => {
      if (!settings.booleans.reviews) {
        message.channel.send(`🚫 A criação de revisões foi desabilitada por um superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
        return true;
      }

      return false;
    });

    if (commandIssues) return;

    switch (args.length) {
      case 2:
        const nickname = args[0];
        const status = args[1];

        if (['aprovada', 'negada'].includes(status.toLowerCase())) {
          try {
            const msg = await sendMessageAndDelete(message.channel, new MessageEmbed()
              .setDescription(`Você está prestes a dar o resultado de uma revisão, escolha um dos emojis com os respectivos motivos atuais:\n
            ${status.toLowerCase().includes('negada') ? `\`\`\`📅 » Prazo encerrado.\n🛠️ » Não consta nenhuma punição ativa em sua conta.\n⚒️ » A punição foi aplicada corretamente.\`\`\`` : `\`\`\`🧲 » A punição foi aplicada incorretamente.\`\`\``}
Você terá \`\`10 segundos\`\` para escolher um motivo para a revisão de **${nickname}**\n para o status ***${status}***!`
              ).setFooter(`Punição à ser revisada ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 10000); 7
            if (status.toLowerCase().includes('negada')) {
              msg.react('📅')
              msg.react('🛠️')
              msg.react('⚒️')

            } else {
              msg.react('🧲')
            }
            const collector = msg.createReactionCollector((reaction: MessageReaction, user: User) => user.id == message.author.id && (reaction.emoji.name == '🛠️' || reaction.emoji.name == '⚒️' || reaction.emoji.name == '📅' || reaction.emoji.name == '🧲'), { time: 1000 * 10, max: 1 });

            collector.on('collect', async (reaction) => {
              reaction.users.remove(message.author)

              const appelChannel = Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.main)?.channels.cache.find(c => c.id == settings.channels.appel) as TextChannel;
              if (appelChannel) {
                let reason;
                switch (reaction.emoji.name) {
                  case '📅': reason = 'Prazo encerrado.'; break;
                  case '🛠️':
                    reason = 'Não consta nenhuma punição ativa em sua conta.'; break;
                  case '⚒️':
                    reason = 'A punição foi aplicada corretamente.'; break;
                  case '🧲':
                    reason = 'A punição foi aplicada incorretamente'; break;
                }
                if (reason) {
                  sendMessageAndDelete(message.channel, new MessageEmbed()
                    .setAuthor(`Revisão efetuada com sucesso!`, `https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/0/0f/Lime_Dye_JE2_BE2.png/150px-Lime_Dye_JE2_BE2.png?version=689addf38f5c21626ee91ec07e6e8670`)
                    .setDescription(`\nVocê selecionou o motivo \`\`${reason}\`\` e este resultado da revisão foi notificado no canal #revisões em nosso servidor principal;`).setFooter(`O resultado da revisão foi enviada ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 10000)
                  appelChannel.send(new MessageEmbed().setDescription(`Um membro punido no servidor recentemente acabou de receber o resultado de
                   sua revisão, confira abaixo algumas informações sobre a revisão, dentre elas
                   membro punido, status e motivo.   
                   \`\`\` Membro: ${nickname}.\n Status da revisão: ${status}.\n Motivo: ${reason}\`\`\``).setFooter(`O resultado da revisão foi enviada ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
                }
              } else {
                sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${`Unknown main guild ID and channel ID.`}`, 5000)
              }
            });

          } catch (error) {
            sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${error}`, 5000)

          }
        } else {
          sendMessageAndDelete(message.channel, `🚫 Use: ${settings.commandPrefix}${command} ${nickname} < Aprovada ou Negada >.`, 2000)
        }

        break;
      default:
        sendMessageAndDelete(message.channel, `🚫 Use: ${settings.commandPrefix}${command} <Nome do usuário do Minecraft> < Aprovada ou Negada >.`, 2000)
        break;
    }
  }
}