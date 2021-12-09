import { Guild, Message, MessageEmbed, MessageReaction, User } from "discord.js";
import Bot from "../../containers/Bot";
import StaffFormulary from "../../containers/StaffFormulary";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import FormularyHandler from "../../handlers/FormularyHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class ReportCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: 'formulario',
      aliases: ['aplicar'],
      description: 'Inicia o formulário de aplicação a equipe;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);

    const issueManager = new IssueManager(message.guild as Guild);
    const commandIssues = await issueManager.finder().commandIssues(message, async (obj, objs) => {
      if (!message.guild?.roles.cache.get(settings.roles.lowerStaff)) {
        objs.push('roles.lowerStaff');
        obj = Object.assign(obj, {
          roles: {
            lowerStaff: null
          }
        });
      }
      if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)) {
        objs.push('guilds.attendance');
        obj = Object.assign(obj, {
          guilds: {
            attendance: null
          }
        });
      } else {
        if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.forms)) {
          objs.push('channels.forms');
          obj = Object.assign(obj, {
            channels: {
              forms: null
            }
          });
        }
      }
    }, (settings: any) => {
      if (settings.type != 'PRINCIPAL') {
        sendMessageAndDelete(message.channel, `Comando exclusivo para o servidor principal!`, 2000);
        return true;
      }
      if (!settings.booleans.forms) {
        message.channel.send(`🚫 A criação formulários foi desabilitada por um superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
        return true;
      }
      if (settings.form.roles.length == 0) {
        message.channel.send(`🚫 Não foi registrado nenhum cargo para vaga por algum superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
        return true;
      }

      return false;
    });

    if (commandIssues) return;
    if ((message.guild?.roles.cache.get(settings.roles.lowerStaff)?.rawPosition || 1) <= (message.member?.roles.highest.rawPosition || 0)) {
      message.channel.send(`🚫 Você não está habilitado para realizar um formulário pois você já faz parte da staff.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
      return;
    }
    const account = await Bot.fromHandler('account').getCache(`${message.author.id}-${message.guild?.id}`);
    if (!account.minecraft.nickname && settings.captchaType == 'advanced') {
      message.channel.send(`🚫 Ocorreu algo inesperado, você não está registrado pelo captcha do servidor, logo você não tem um nickname.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
      return;
    }
    const form = await Bot.fromHandler('forms').getCache(account.minecraft.nickname.toLowerCase(), false);
    if (form) {
      message.channel.send(`🚫 Você já tem um formulário pendente.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } })
      return;
    }

    sendMessageAndDelete(message.channel, new MessageEmbed().
      setDescription(
        `Você terá que responder: **${settings.form.asks.length} perguntas**

    \`\`\`✔️ » Para iniciar;\n❌ » Para cancelar;\`\`\``).
      setColor('#303030').
      setAuthor(`Formulário para aplicação! - CARGO: ${settings.form.roles[0]}`, `https://emoji.gg/assets/emoji/3339_loading.gif`).
      setImage(`https://minecraftskinstealer.com/achievement/29/Formulários/Vamos-lá%3F`).
      setFooter(`Tentativa de abertura de formulário de aplicação iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 20 * 1000)
      .then(m => {
        m.react('✔️');
        m.react('❌');

        const collectorReaction = m.createReactionCollector((reaction: MessageReaction, user: User): boolean => { return user.id == message.author.id && (reaction.emoji.name == '❌' || reaction.emoji.name == '✔️') }, { time: 1000 * 20, max: 1 });
        collectorReaction.on('collect', async (reaction: MessageReaction, user: User) => {
          collectorReaction.stop();
          switch (reaction.emoji.name) {
            case '❌':
              sendMessageAndDelete(m.channel, `> 📌 Você cancelou o formulário para aplicação!`, 5000);
              reaction.message.delete();
              break;
            case '✔️':
              m.reactions.removeAll();
              m.edit(new MessageEmbed().
                setDescription(
                  `Tudo pronto! :smile: Agora você irá iniciar o seu formulário de aplicação para o servidor **${message.guild?.name}**.

          __Tudo será feito em seu privado através do nosso bot.__

           **__Obs__: Você só poderá enviar outro após o atual ser respondido.**
           **__Obs²__: Essa mensagem irá ser deletada automaticamente.**
            `).
                setColor('#00e5ff').
                setAuthor(`Formulário para aplicação! - CARGO: ${settings.form.roles[0]}`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`).
                setImage(`https://minecraftskinstealer.com/achievement/33/Estamos+quase+l%C3%A1%21/Olhe+em+sua+DM`).
                setFooter(`Tentativa de abertura de formulário de aplicação iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))

              if (!!user.dmChannel) {
                FormularyHandler.createFormulary(user, new StaffFormulary(user, message.guild as Guild, settings.form.roles[0]))
              } else {
                sendMessageAndDelete(message.channel, new MessageEmbed().setTitle('Não pudemos criar seu formulário!')
                  .setDescription('Pedimos que você ative o envio de mensagem privadas para prosseguir com a criação do formulário.').setColor('#36393f')
                  .setImage(
                    `https://minecraftskinstealer.com/achievement/6/${user.username?.replace(' ', '+')}/Sua+DM+está+fechada!`), 2000);
              }
              break;
          }
        })
      });
  }
}