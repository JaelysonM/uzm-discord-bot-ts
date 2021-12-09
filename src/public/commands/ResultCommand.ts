import { Guild, Message, MessageEmbed, MessageReaction, TextChannel, User } from "discord.js";
import Bot from "../../containers/Bot";
import Forms from "../../containers/Forms";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ReviewCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "resultado",
      roles: ['ADMIN_PERM'],
      description: 'Da um resultado para um formulário.'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);


    const commandIssues = await new IssueManager(message.guild as Guild).finder().commandIssues(message, async (obj, objs) => {
    }
    );

    if (commandIssues) return;

    switch (args.length) {
      case 2:
        const nickname = args[0];
        const status = args[1];

        const form = await Bot.fromHandler('forms').getCache(nickname.toLowerCase(), false);
        if (!form) {
          message.channel.send(`🚫 ${nickname} não tem um formulário pendente.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
          return;
        }

        const target = Bot.instance.client.users.cache.get(form.user);
        if (!target) {
          message.channel.send(`🚫 ${nickname} não está ao alcançe do nosso bot.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
          return;
        }
        if (['aprovado', 'negado'].includes(status.toLowerCase())) {
          try {
            const msg = await sendMessageAndDelete(message.channel, new MessageEmbed()
              .setDescription(`Você está prestes a dar o resultado de um formulário, escolha um dos emojis com os respectivos motivos atuais:\n
            ${status.toLowerCase().includes('negado') ? `\`\`\`👎 » Respostas insatisfatórias.\n🚫 » Falta de informações.\n⚠️ » Outros motivos pessoais e profissionais.\`\`\`` : `\`\`\`♻️ » Aprovado, respondeu corretamente e etc.\`\`\``}
Você terá \`\`10 segundos\`\` para escolher um motivo para a revisão de **${form.minecraft.nickname}**\n para o status ***${status}***!`
              ).setFooter(`Punição à ser revisada ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 10000); 7
            if (status.toLowerCase().includes('negado')) {
              msg.react('👎')
              msg.react('🚫')
              msg.react('⚠️')

            } else {
              msg.react('♻️')
            }
            const collector = msg.createReactionCollector((reaction: MessageReaction, user: User) => user.id == message.author.id
              && (reaction.emoji.name == '👎' || reaction.emoji.name == '🚫' || reaction.emoji.name == '⚠️' || reaction.emoji.name == '♻️'), { time: 1000 * 10, max: 1 });

            collector.on('collect', async (reaction) => {
              reaction.users.remove(message.author)


              let reason;
              switch (reaction.emoji.name) {
                case '👎': reason = 'Respostas insatisfatórias'; break;
                case '🚫':
                  reason = ' Falta de informações.'; break;
                case '⚠️':
                  reason = 'Outros motivos pessoais e profissionais.'; break;
                case '♻️':
                  reason = 'A punição foi aplicada incorretamente'; break;
              }
              if (reason) {

                Forms.result(message.author, status, target, form, reason);
                sendMessageAndDelete(message.channel, new MessageEmbed()
                  .setAuthor(`Formulário respondido com sucesso`, `https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/0/0f/Lime_Dye_JE2_BE2.png/150px-Lime_Dye_JE2_BE2.png?version=689addf38f5c21626ee91ec07e6e8670`)
                  .setDescription(`\nVocê selecionou o motivo \`\`${reason}\`\` e este resultado do formulário foi enviado no privado do candidato;`).setFooter(`O resultado da formulário foi enviado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 10000)

              } else {
                sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${`Unknown main guild ID and channel ID.`}`, 5000)
              }
            });

          } catch (error) {
            sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${error}`, 5000)

          }
        } else {
          sendMessageAndDelete(message.channel, `🚫 Use: ${settings.commandPrefix}${command} ${nickname} < Aprovado ou Negado >.`, 2000)
        }

        break;
      default:
        sendMessageAndDelete(message.channel, `🚫 Use: ${settings.commandPrefix}${command} <Nome do usuário do Minecraft> < Aprovado ou Negado >.`, 2000)
        break;
    }
  }
}