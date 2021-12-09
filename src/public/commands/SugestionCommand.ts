import { Guild, Message, MessageEmbed, MessageReaction, User } from "discord.js";
import Bot from "../../containers/Bot";
import Suggestion from "../../containers/Suggestion";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ReportCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'sugestão',
      aliases: ['sugestao'],
      description: 'Sugerir uma ideia para o servidor.'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);

    const issueManager = new IssueManager(message.guild as Guild);
    const commandIssues = await issueManager.finder().commandIssues(message, async (obj, objs) => {
      if (!message.guild?.channels.cache.find(c => c.id == settings.channels.suggestions)) {
        objs.push('channels.suggestions');
        obj = Object.assign(obj, {
          channels: {
            suggestions: null
          }
        });

      }
    }, (settings: any) => {
      if (settings.type != 'PRINCIPAL') {
        sendMessageAndDelete(message.channel, `Comando exclusivo para o servidor principal!`, 2000);
        return true;
      }
      return false;
    });

    if (commandIssues) return;

    const account = await Bot.fromHandler('account').getCache(`${message.author.id}-${message.guild?.id}`);
    if (account.suggestionTimestamp != 0 && account.suggestionTimestamp > Date.now()) {

      try {
        const m = await message.author.send(new MessageEmbed().setTitle('Intervalo para criação de sugestões!')
          .setDescription(`<@${message.author}> Você está em um intervalo de criação de sugestões!`).setColor('#36393f')
          .setImage(
            `https://minecraftskinstealer.com/achievement/17/Aguarde:/${TimeFormatter.VANILLA_TIMER.format(account.suggestionTimestamp - Date.now())}`,
          ))
        await m.delete({ timeout: 10000 }).then(() => { }).catch((err) => { });
      } catch (error) {
      }

      return;
    }

    sendMessageAndDelete(message.channel, new MessageEmbed().
      setDescription(
        `Você terá que responder: **${settings.form.asks.length} perguntas**

    \`\`\`✔️ » Para iniciar;\n❌ » Para cancelar;\`\`\``).
      setColor('#303030').
      setAuthor(`Formulário para sugestão!`, `https://emoji.gg/assets/emoji/3339_loading.gif`).
      setImage(`https://minecraftskinstealer.com/achievement/29/Formulários/Vamos-lá%3F`).
      setFooter(`Tentativa de abertura de formulário de sugestão iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 20 * 1000)
      .then(m => {
        m.react('✔️');
        m.react('❌');

        const collectorReaction = m.createReactionCollector((reaction: MessageReaction, user: User): boolean => { return user.id == message.author.id && (reaction.emoji.name == '❌' || reaction.emoji.name == '✔️') }, { time: 1000 * 20, max: 1 });
        collectorReaction.on('collect', async (reaction: MessageReaction, user: User) => {
          collectorReaction.stop();
          switch (reaction.emoji.name) {
            case '❌':
              sendMessageAndDelete(m.channel, `> 📌 Você cancelou o formulário para sugestão!`, 5000);
              reaction.message.delete();
              break;
            case '✔️':
              m.reactions.removeAll();
              m.edit(new MessageEmbed().
                setDescription(
                  `Tudo pronto! :smile: Agora você irá iniciar o seu formulário de sugestão para o servidor **${message.guild?.name}**.

          __Tudo será feito em seu privado através do nosso bot.__

           **__Obs__: Você só poderá enviar outro após 1 dia.**
           **__Obs²__: Essa mensagem irá ser deletada automaticamente.**
            `).
                setColor('#fbff00').
                setAuthor(`Formulário para sugestão!`, `https://i.imgur.com/sqj929K.gif`).
                setImage(`https://minecraftskinstealer.com/achievement/33/Estamos+quase+l%C3%A1%21/Olhe+em+sua+DM`).
                setFooter(`Tentativa de abertura de formulário de sugestão iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
              Suggestion.build(user, message.guild as Guild).init();

              break;
          }

        })
      });
  }
}