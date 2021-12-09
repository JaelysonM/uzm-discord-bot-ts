import { Guild, Message, MessageEmbed, Snowflake, TextChannel, User } from "discord.js";
import SettingsCache from "../database/cache/SettingsCache";
import IssueManager from "../managers/IssueManager";
import log from "../services/logs";
import { sendMessageAndDelete } from "../utils/MessageUtils";
import TimeFormatter from "../utils/TimeFormatter";
import TimeUnit from "../utils/TimeUnit";
import Bot from "./Bot";

export interface ITicket {
  readonly guild: Guild;
  readonly channel: TextChannel;
  readonly user: User;
  readonly staff: User | any;
}

export default class Ticket {


  public static get cache(): Map<Snowflake, Ticket> { return this._cache; };

  private static _cache: Map<Snowflake, Ticket> = new Map<Snowflake, Ticket>();


  private _user: User;
  private _guild: Guild;
  private _staffGuild: Guild;
  private _channel: TextChannel;
  private _staff: Guild | any;

  private _chatPainelMessage: Message | any;
  private _painelMessage: Message | any;
  private _holderMessage: Message | any;

  private _timestamp: number;

  constructor(user: User, channel: TextChannel, guild: Guild, staffGuild: Guild, painelMessage: Message, chatPainelMessage: Message, holderMessage: Message) {
    this._user = user;
    this._guild = guild;
    this._channel = channel;
    this._staffGuild = staffGuild;
    this._painelMessage = painelMessage;
    this._chatPainelMessage = chatPainelMessage;
    this._timestamp = Date.now() + TimeUnit.MINUTES.toMillis(1);
    this._holderMessage = holderMessage;
    this._staff = null;

  }

  public async holdTicket(user: User) {
    this._staff = user;

    this._chatPainelMessage.edit(new MessageEmbed()
      .setDescription(
        `Este ticket foi criado pelo membro:\n\`\`${`${this.user.username}#${this.user.discriminator}`}\`\`\n\nReaja com ❌ para encerrar o ticket e deletar o canal;\nReaja com ☝ para adquirir esse ticket;\n\nAtendente responsável: \`\`${`${this._staff.username}#${this._staff.discriminator}`}\`\`\n\nID de recuperação do ticket:\n\`\`${this.channel.id}\`\``,
      )
      .setThumbnail('https://i.imgur.com/33E8tfJ.png')
      .setColor('#01C1BE'));

    if (this._holderMessage !== null) {
      this._holderMessage.edit(new MessageEmbed()
        .setTitle(`Você será atendido por ${user.username}`)
        .setDescription(`\nEnvie qualquer dúvida para o atendente que ela será encaminhada\npara nossa central de tickets, local onde ela será respondida por \`\`${user.username}#${user.discriminator}\`\`;\n\nTempo máximo de resposta \`\`1 minuto\`\``)
        .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730080440352823/RespTicket.png')
        .setColor('#51FF00'));
    }
  }

  public async deleteTicket(embed: MessageEmbed) {
    if (this.staff)
      log(this.guild, 'ticketEnd', `${this.staff.username} fechou manualmente o ticket de ${this.user.username}`);
    else
      log(this.guild, 'ticketEnd', `O ticket de ${this.user.username} foi encerrado por alguém desconhecido.`);
    try {
      if (this._painelMessage !== null) try {
        this._painelMessage.delete();
      } catch (err) { };
      if (this._holderMessage !== null) try {
        this._holderMessage.delete()
      } catch (err) { };
      if (this.channel !== null) try {
        this.channel.delete()
      } catch (err) { };
      try {
        await this.user.send(embed)
      } catch (error) { }
      Ticket.remove(this.user.id);
    } catch (err) { }
  }

  public async redirectMessage(message: Message, client: boolean) {
    this._timestamp = Date.now() + TimeUnit.MINUTES.toMillis(10);
    if (this.channel != null) {
      if (message.attachments.size > 0) {
        if (client) {
          await this.channel.send(new MessageEmbed()
            .setTitle(`Mensagem de ${this.user.username}#${this.user.discriminator}:`)
            .setDescription('Enviou uma imagem:').setImage(message.attachments.array()[0].url)
            .setFooter('Todas as mensagem enviadas neste canal serão redirecionadas; ')
            .setTimestamp(Date.now()));
        } else {
          try {
            await this.user.send(new MessageEmbed()
              .setTitle(`${message.author.username} respondeu:`)
              .setDescription('Enviou uma imagem:').setImage(message.attachments.array()[0].url)
              .setFooter('Todas as mensagem enviadas neste canal serão redirecionadas; ')
              .setTimestamp(Date.now()));
          } catch (err) { }
        }


      } else {
        if (client) {
          try {
            await this.channel.send(new MessageEmbed()
              .setTitle(`Mensagem de ${this.user.username}#${this.user.discriminator}:`)
              .setDescription(message.content).setFooter('Todas as mensagem enviadas neste canal serão redirecionadas; ')
              .setTimestamp(Date.now()));
          } catch (error) { }
        } else {
          try {
            await this.user.send(new MessageEmbed()
              .setTitle(`${message.author.username} respondeu:`)
              .setDescription(message.content).setFooter('Todas as mensagem enviadas neste canal serão redirecionadas; ')
              .setTimestamp(Date.now()));
          } catch (error) { }
        }

      }
      if (this.channel != null) {
        if (client) {
          await this.user.send(new MessageEmbed()
            .setTitle('Recebemos sua mensagem!')
            .setDescription('Sua mensagem chegou em nossa central de tickets, em alguns momentos você receberá uma resposta de nossos atendentes e será notificado novamente;')
            .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730080440352823/RespTicket.png')
            .setColor('#42f5cb')).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } });
        } else {
          sendMessageAndDelete(this.channel, new MessageEmbed()
            .setTitle(`Sua mensagem foi enviada para ${this.user.username}`)
            .setDescription('Sua mensagem chegou até o ``usuário``, aguarde a próxima dúvida ou feche o ticket;')
            .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730080440352823/RespTicket.png')
            .setColor('#42f5cb'), 5000)
        }
      }

    } else {
      try {
        await message.author.send(':x: Você não possui um ticket aberto, logo não computamos esta mensagem!').then(async message => { try { await message.delete({ timeout: 1500 }) } catch (error) { } });
      } catch (error) { }
    }

  }

  public async buildPainel() {
    const ticketChat = await this._staffGuild.channels.create(`#${this.user.discriminator}`, { type: 'text' });
    let category = await this._staffGuild.channels.cache.find(ch => ch.type == "category" && ch.name.toUpperCase().includes("TICKETS"));

    if (!category) {
      category = await this._staffGuild.channels.create(`TICKETS`, { type: 'category' })
    }
    if (ticketChat === null) return;
    ticketChat.setParent(category.id);
    ticketChat.setTopic(`Canal de ticket do usuário ${this.user.username}`);
    this._channel = ticketChat;
    await this.channel.send(new MessageEmbed()
      .setDescription(
        `Este ticket foi criado pelo membro:\n\`\`${`${this.user.username}#${this.user.discriminator}`}\`\`\n\nReaja com ❌ para encerrar o ticket e deletar o canal;\nReaja com ☝ para adquirir esse ticket;\n\nAtendente responsável: \`\`Nínguem\`\`\n\nID de recuperação do ticket:\n\`\`${ticketChat.id}\`\``,
      )
      .setThumbnail('https://i.imgur.com/33E8tfJ.png')
      .setColor('#01C1BE')).then(async (message) => {
        this._chatPainelMessage = message;
        await message.react('☝');
        await message.react('❌');
      });

    try {
      this.user.send(new MessageEmbed()
        .setTitle('Este processo pode demorar alguns segundos!')
        .setDescription('Sua mensagem está sendo encaminhada para a central de tickets, quando recebermos a mensagem você será notificado.')
        .setThumbnail('https://media.discordapp.net/attachments/678369832147615775/688730074077331525/AlertTicket.png')
        .setColor('#f5d442'));
    } catch (error) { }
  }
  public static ticketsCleanTask() {
    setInterval(async () => {
      Array.from(this.cache.values()).filter(result => result._timestamp < Date.now()).forEach(async (ticket: Ticket) => {
        ticket.deleteTicket(new MessageEmbed()
          .setTitle('Você teve seu ticket fechado automaticamente!')
          .setDescription(`Seu ticket foi encerrado em nossa central por: \`\`ausência\`\`\n\n${ticket._staff == null ? `Você poderá criar um novo ticket sem nenhum intervalo de tempo, visto que não havia nenhum atendente com seu ticket;` : `Você terá que esperar \`\`3 horas\`\`\ para criar outro ticket para nós`}\nIsso ocorre com todos os tickets fechados em nossa central.\n\nFechado em: \`\`${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}\`\``)
          .setThumbnail(`https://media.discordapp.net/attachments/678369832147615775/688730074077331525/AlertTicket.png`)
          .setColor(`#f5d442`));
        const cache = SettingsCache.instance();
        const settings = await cache.getCache(ticket.guild.id);
        if (settings.booleans.ticketDelay) {
          await Bot.fromHandler('account').updateCache(`${ticket.user.id}-${ticket.guild.id}`, { ticketTimestamp: Date.now() + TimeUnit.HOURS.toMillis(3) }, true);
        }
      })
    }, TimeUnit.MINUTES.toMillis(2));
  }
  public static async updatePainel() {
    const task = async () => {
      (await SettingsCache.instance().list(true)).forEach(async (settings: any, key: any) => {

        const guild = Bot.instance.client.guilds.cache.get(key) as Guild;
        if (!guild) return;
        const commandIssues = await new IssueManager(guild as Guild).finder().issues(async (obj, objs) => {
          if (!guild.channels.cache.get(settings.channels.attendancePainel)) {
            objs.push('channels.attendancePainel', 'messages.attendancePainel');
            obj = Object.assign(obj, {
              channels: {
                attendancePainel: null
              },
              messages: {
                attendancePainel: null
              }
            });
          } else {
            const blockFetch = await (guild.channels.cache.get(settings.channels.attendancePainel) as TextChannel).messages.fetch(settings.messages.attendancePainel);
            if (!blockFetch) {
              objs.push('messages.attendancePainel');
              obj = Object.assign(obj, {
                messages: {
                  attendancePainel: null
                }
              });
            }
          }
        }, (settings: any) => {
          if (settings.type != 'PRINCIPAL') {
            return true;
          }
          return false;
        });

        if (commandIssues) return;
        await (guild.channels.cache.get(settings.channels.attendancePainel) as TextChannel).messages.fetch(settings.messages.attendancePainel).then(message => {
          message.edit(new MessageEmbed()
            .setTitle(`Área de atendimento ao jogador.`)
            .setDescription(`Clique no emoji abaixo para ser redirecionado a\n criação de seu ticket, o atendimento será realizado por meio de suas mensagens privadas.\n\nAgora estamos com **${(Ticket.cache.size / (settings.tickets.capacity) * 100).toFixed(2)
              }%** da central em uso.`)
            .setImage('https://minecraftskinstealer.com/achievement/19/Converse+conosco%21/Clique+no+emoji+abaixo.')
            .setColor(`#36393f`))
        });
      })
    }
    await task();
    setInterval(task, 1000 * 60);
  }

  public get user() { return this._user; }
  public get guild() { return this._guild; }
  public get channel() { return this._channel; }
  public get staff() { return this._staff; }

  public get staffGuild() { return this._staffGuild; }

  public static get(id: string): Ticket {
    return this.cache.get(id) as Ticket
  }

  public static remove(id: string): void {
    this.cache.delete(id);
  }
  public static findByChannel(id: string): Ticket {
    return Array.from(this.cache.values()).filter(r => r._channel != null && r._channel.id == id)[0];
  }

  public static build(user: User | any, channel: TextChannel | any, guild: Guild | any, staffGuild: Guild | any, painelMessage: Message | any, chatPainelMessage: Message | any, holderMessage: Message | any): Ticket {
    if (!this.cache.has(user.id)) {
      this.cache.set(user.id, new Ticket(user, channel, guild, staffGuild, painelMessage, chatPainelMessage, holderMessage));
    }

    return this.cache.get(user.id) as Ticket;

  }

}