import { Guild, MessageEmbed, TextChannel, User } from 'discord.js';
import { ArgsOf } from '../../classes/types/ArgsOf';
import Bot from '../../containers/Bot';
import Registration from '../../containers/Registration';
import Ticket from '../../containers/Ticket';
import AccountCache from '../../database/cache/AccountCache';
import SettingsCache from '../../database/cache/SettingsCache';
import EventHandler from '../../handlers/EventHandler';
import IssueManager from '../../managers/IssueManager';
import { isNumber } from '../../utils/Functions';
import { sendMessageAndDelete } from '../../utils/MessageUtils';
import TimeFormatter from '../../utils/TimeFormatter';
import TimeUnit from '../../utils/TimeUnit';

export default class TicketListeners {

  public static presenceQueue: User[] = [];

  @EventHandler('message')
  async onTicketClientMessage([message]: ArgsOf<'message'>) {
    if (message.guild !== null || message.author.bot) return;
    if (Ticket.get(message.author.id)) {
      const ticket = Ticket.get(message.author.id);
      const cache = SettingsCache.instance();
      const settings = await cache.getCache(ticket.guild.id);

      let messageContent = null;
      if (isNumber(message.content) && parseInt(message.content) <= settings.faq.length && parseInt(message.content) > 0) {
        messageContent = settings.faq[parseInt(message.content) - 1].response;
        try {
          ticket.user.send(messageContent);
        } catch (error) {
        }
        return;
      }
      messageContent = message.content;

      if (ticket.channel == null) {
        await ticket.buildPainel();
      }
      ticket.redirectMessage(message, true);
    }
  }
  @EventHandler('message')
  async onTicketStaffMessage([message]: ArgsOf<'message'>) {
    if (message.guild === null || message.author.bot) return;
    if (!(message.channel as TextChannel).topic?.startsWith('Canal de ticket do usuário ')) return;
    const ticket = Ticket.findByChannel(message.channel.id);
    if (ticket) {
      if (ticket.staff === null) message.delete();
      if (message.author === ticket.staff && ticket.staff != null) {
        ticket.redirectMessage(message, false);
      } else {
        if (ticket.staff != null) {
          await message.author.send(new MessageEmbed()
            .setTitle('Ticket já arrematado!')
            .setDescription(`Este ticket já está em posse do atendente ${ticket.staff.username}#${ticket.staff.discriminator}`)
            .setThumbnail(ticket.staff.avatarURL)
            .setColor('#FF0000')).then(async message => { try { await message.delete({ timeout: TimeUnit.SECONDS.toMillis(10) }) } catch (error) { } });
          try {
            await message.delete();
          } catch (error) { }
        }
      }
    }

  }


  @EventHandler('messageReactionAdd')
  async onTicketStaffReact([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (!messageReaction.message.guild || user.bot) return;
    if (!(messageReaction.message.channel as TextChannel).topic?.startsWith('Canal de ticket do usuário ')) return;
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(messageReaction.message.guild.id);

    const ticket = Ticket.findByChannel(messageReaction.message.channel.id);
    if (ticket) {
      switch (messageReaction.emoji.name) {
        case '☝':
          if (ticket.staff === null) {
            ticket.holdTicket(user as User);
          } else {
            await messageReaction.users.remove(user as User);
          }
          break;
        case '❌':
          ticket.deleteTicket(new MessageEmbed()
            .setTitle('Você teve seu ticket fechado!')
            .setDescription(`Seu ticket foi encerrado em nossa central por: \`\`${user.username}#${user.discriminator}\`\`\n\nVocê terá que esperar \`\`3 horas\`\` para criar outro ticket para nós;\nIsso ocorre com todos os tickets fechados em nossa central.\n\nFechado em: \`\`${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}\`\``)
            .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730074077331525/AlertTicket.png')
            .setColor('#f5d442'))
          if (settings.booleans.ticketDelay) {
            AccountCache.instance().updateCache(`${ticket.user.id}-${ticket.guild.id}`, { ticketTimestamp: Date.now() + TimeUnit.HOURS.toMillis(3) }, true);
          }
          break;
      }
    }
  }

  @EventHandler('messageReactionAdd')
  async onTicketClientReact([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (messageReaction.message.guild == null) return;
    if (user.bot) return;
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(messageReaction.message.guild.id);

    switch (messageReaction.emoji.name) {
      case '❓':
        if (settings.channels.attendancePainel != messageReaction.message.channel.id) return;
        if (settings.messages.attendancePainel != messageReaction.message.id) return;
        messageReaction.users.remove(user as User);

        const commandIssues = await new IssueManager(messageReaction.message.guild as Guild).finder().issues(async (obj, objs) => {
          if (!messageReaction.message.guild?.channels.cache.find(r => r.id == settings.channels.attendancePainel)) {
            objs.push('channels.attendancePainel', 'messages.attendancePainel');
            obj = Object.assign(obj, {
              channels: {
                attendancePainel: null
              }, messages: {
                attendancePainel: null
              }
            });
          } else {
            if (!(messageReaction.message.guild?.channels.cache.find(r => r.id == settings.channels.attendancePainel) as TextChannel).messages.cache.find(m => m.id == settings.messages.attendancePainel)) {
              objs.push('messages.attendancePainel');
              obj = Object.assign(obj, {
                messages: {
                  attendancePainel: null
                }
              });
            }
          }
        });


        if (commandIssues) return;

        if (!settings.booleans.tickets) {
          try {
            const message = await user.send(new MessageEmbed().setTitle('Tickets desativados!')
              .setDescription(`${user} o criação de tickets está  \`\`desativada\`\`, aguarde e tente novamente mais tarde!`).setColor('#36393f')
              .setImage(
                'https://minecraftskinstealer.com/achievement/38/Cria%C3%A7%C3%A3o%20de%20tickets:/Desativada',
              ))
            await message.delete({ timeout: 4000 }).then(() => { }).catch((err) => { });
          } catch (error) { }
          return;
        }
        const account = await AccountCache.instance().getCache(`${user.id}-${messageReaction.message.guild.id}`);
        if (settings.booleans.ticketsDelay && account.ticketTimestamp != 0 && account.ticketTimestamp > Date.now()) {

          try {
            const message = await user.send(new MessageEmbed().setTitle('Intervalo para criação de ticket!')
              .setDescription(`${user} Você está em um intervalo de criação de tickets!`).setColor('#36393f')
              .setImage(
                `https://minecraftskinstealer.com/achievement/17/Aguarde:/${TimeFormatter.VANILLA_TIMER.format(account.ticketTimestamp - Date.now())}`,
              ))
            await message.delete({ timeout: 10000 }).then(() => { }).catch((err) => { });
          } catch (error) {
          }

          return;
        }
        if (Ticket.cache.size >= settings.tickets.capacity) return;
        if (Ticket.get(user.id)) return;
        try {

          const mainPainelMessage = await user.send(`${user}`, new MessageEmbed().setTitle('Converse conosco')
            .setDescription(`Você pode enviar mais informações sobre sua dúvida do ou no servidor aqui mesmo. Lembrando que, o sistema suporta imagens e links enviados.
  
                    **Perguntas frequentemente enviadas!**
                   
                    Caso sua dúvida seja umas das listadas abaixo, basta enviar o ID correspondente a sua dúvida neste canal! Caso contrario, prossiga informando sua dúvida.
                    \`\`\`${(settings.faq as Object[]).map((obj: any, index) => `${index + 1} » ${obj.name}`).join('\n')} \`\`\` 
                    `));

          sendMessageAndDelete(messageReaction.message.channel, new MessageEmbed().setTitle('Criando seu ticket')
            .setDescription('Pedimos que você redirecione-se as suas mensagens privadas onde estaremos enviando informações.').setColor('#36393f')
            .setImage(
              `https://minecraftskinstealer.com/achievement/10/${user.username?.replace(' ', '+')}/Confira+seu+privado`), 2000);

          const holderMessage = await user.send(new MessageEmbed()
            .setTitle(`Aguarde algum atendente...`)
            .setDescription('Dentro de alguns momentos ele será arrematado e respondido, fique a vontade para falar sua dúvida.\n\nNão se preocupe se você não for atendido ele irá fechar\nautomaticamente, e você poderá abrir um novo posteriormente.')
            .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730074077331525/AlertTicket.png')
            .setColor('#f5d442'));

          Ticket.build(user, null, messageReaction.message.guild, Bot.instance.client.guilds.cache.get(settings.guilds.attendance), null, mainPainelMessage, holderMessage)
          await messageReaction.users.remove(user.id);

        } catch (err) {
          sendMessageAndDelete(messageReaction.message.channel, new MessageEmbed().setTitle('Não pudemos criar seu ticket!')
            .setDescription('Pedimos que você ative o envio de mensagem privadas para prosseguir com a criação do ticket.').setColor('#36393f')
            .setImage(
              `https://minecraftskinstealer.com/achievement/6/${user.username?.replace(' ', '+')}/Sua+DM+está+fechada!`), 2000);
        }
        break;
    }
  }
}

