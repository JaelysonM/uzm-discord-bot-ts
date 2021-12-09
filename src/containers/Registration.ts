import { Guild, Message, MessageAttachment, MessageCollector, MessageEmbed, MessageReaction, Snowflake, TextChannel, User } from "discord.js";
import SettingsCache from "../database/cache/SettingsCache";
import { dotify, objectAssign } from '..//utils/Functions';
import nodeHtmlToImage from 'node-html-to-image';
import dot from 'dot-object';

import { buildProgressiveCircle } from "../html/ImageCreator";
import Bot from "./Bot";
import TimeFormatter from "../utils/TimeFormatter";
import IssueManager from "../managers/IssueManager";
import log from "../services/logs";

export interface IRegistration {
  readonly guild: Guild;
  readonly channel: TextChannel;
  readonly user: User;
}

export default class Registration implements IRegistration {

  public static get cache(): Map<Snowflake, Registration> { return this._cache; };

  private static _cache: Map<Snowflake, Registration> = new Map<Snowflake, Registration>();

  private _user: User;
  private _guild: Guild;
  private _channel: TextChannel;
  public currentOffset: number = -1;
  private currentKey: any;
  public obj: any = {};
  private obj_dot: any = {};
  private instanceSettings: SettingsCache;
  private message: Message | any;
  public missingData: any;
  private missingDataTranslated: any;
  private _pageLock: boolean = false;
  private maxReach: number = 0;
  private lastAction: number = 0;
  private taskId: any;


  constructor(user: User, guild: Guild, channel: TextChannel) {
    this._user = user;
    this._guild = guild;
    this._channel = channel;
    this.instanceSettings = SettingsCache.instance();
  }


  public async init() {
    this.currentOffset = 0;
    await this.generateTab();
    this.runCleanTask();
  }

  private runCleanTask() {
    this.taskId = setInterval(async () => {
      if (this.lastAction > 0) {
        if ((this.lastAction + 1000 * 60 * 5) <= Date.now()) {
          await this.destroy();
        }
      }
    }, 1000)
  }


  public async destroy(user: any = undefined, save: boolean = false) {
    Registration.remove(this.guild.id);
    clearInterval(this.taskId);
    const guildSettings = await this.instanceSettings.getCache(this.guild.id);
    const prefix = guildSettings ? guildSettings.commandPrefix : '/';
    if (this.user) {
      let embed;
      if (!save) {
        embed = new MessageEmbed().setAuthor(`Abertura de registro inicial - ${this.guild.name}!`, `https://i.imgur.com/o5RTi2H.gif`).setDescription(`
        Seu registro inicial foi cancelado ${user == undefined ? `por ultrapassar 10 minutos de inatividade!` : `por você!`}. Caso queira refazer o registro digite o comando \`\`${prefix}register\`\`
        
       Pedimos que se tenha feito isso sem querer, tome cuidado na próxima vez, pois após o cancelamento todo o progresso é perdido.`);

      } else {
        embed = new MessageEmbed().setColor('#1fff4b').setImage(`https://minecraftskinstealer.com/achievement/8/Obrigado!/Aproveite+o+seu+bot%21`).setAuthor(`Abertura de registro inicial finalizada! - ${this.guild.name}!`, `https://i.imgur.com/gntqLpd.gif`)
          .setDescription(`
     
         Seu registro em nosso bot foi **concluído**! Uhuuuuu 🥳!
         
         Agradecemos pela sua paciência e colaboração durante todo esse processo que, convenhamos, é um pouco chato, mas muito necessário o bom funcionamento de seu bot 😉!
         
         Para mudar algumas coisas mais fáceis use nosso comando \`\`${prefix}dashboard\`\` ou veja outros comandos pelo \`\`${prefix}ajuda\`\`!
     
         `).setFooter(`Nós da equipe Uzm Studio Inc. agradecemos sua prefêrencia 💛!`);
        this.obj.configured = true;
        this.instanceSettings.updateCache(this.guild.id, this.obj, true);
      }
      if (embed) {
        const icon = this.guild.iconURL({
          dynamic: true,
          format: 'gif',
          size: 128
        });
        if (icon) {
          embed.setThumbnail(icon);
        }
        this.user.send(embed).then(() => { }).catch(() => { });
      }

      log(this.guild, 'configured', `${this.user.username} terminou a configuração inicial do servidor.`);
    }
    try {
      await this.channel.delete();
    } catch (ignore) { }
  }
  private async preSaveProgress() {

    this.currentOffset = this.missingData.length;
    const image = await nodeHtmlToImage({
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      transparent: true,
      html: buildProgressiveCircle(100)
    });
    const attachment = new MessageAttachment(image as Buffer, `finished.png`);

    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setThumbnail(`attachment://finished.png`)
      .setColor('#1fff4b').
      setAuthor(`Finalmente terminamos 😉!`, `https://i.imgur.com/gntqLpd.gif`).
      setDescription(`
     
    Para finalizar o cadastro precisamos da sua confirmação :smile:!
     
     \`\`\`json\n🧐 Vamos-lá, para finalizar clique em ✅!\`\`\`
 
     `).setFooter(`Painel de registro de configuração quase finalizado em: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/2/Processo+conclu%C3%ADdo%21/Deseja+finalizar%3F`);
    if (this.message) this.message.delete().then(() => { }).catch(() => { });
    if (this.channel)
      this.message = await this.channel.send(embed)

    this._pageLock = false;

    this.message.react('✅')
    this.message.react('❌')
    if (this.currentOffset > 0) {
      this.message.react('⬅️')
    }
  }

  private async processInformation(collector: MessageCollector, message: Message, content: any, format: string, internal: boolean = false) {
    this._pageLock = true;
    if (!this.channel) return;
    try {
      const msg = await this.channel.send(`${format.replace('$content', content)}`);
      await message.delete().then(() => { }).catch(() => { });
      await msg.react('✅')
      await msg.react('❌')
      const collectorReaction = msg.createReactionCollector((reaction: MessageReaction, user: User): boolean => { return msg.id == reaction.message.id && user.id == message.author.id && (reaction.emoji.name == '❌' || reaction.emoji.name == '✅') }, { time: 1000 * 10, max: 1 });
      collectorReaction.on('collect', async (reaction: MessageReaction, user: User) => {
        msg.delete().then(() => { }).catch(() => { });
        switch (reaction.emoji.name) {
          case '✅':
            collector.stop();
            if (this.missingData[this.currentOffset] == 'type' && content.toLowerCase() == 'atendimento') {
              this.copyMainServer();
              return;
            }
            if (internal) {
              const guildToHook = await this.instanceSettings.getCache(message.content);
              this.obj['type'] = 'ATENDIMENTO';
              this.obj = objectAssign(this.obj, guildToHook);
              this.currentOffset = this.missingData.length;
              this.generateTab();
              return;
            }
            this.obj[this.missingData[this.currentOffset]] = content;

            this.obj = dot.object(this.obj);
            this.obj_dot = dotify(this.obj);
            this.currentOffset += 1;
            this.generateTab();
            this._pageLock = false;

            break;
          default:
            this._pageLock = false;
            break;
        }

      })
    } catch (err) { }
  }


  private async copyMainServer() {
    this.currentOffset = -1;

    const image = await nodeHtmlToImage({
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      transparent: true,
      html: buildProgressiveCircle(100),
    });
    const attachment = new MessageAttachment(image as Buffer, `finished.png`);

    const embed = new MessageEmbed()
      .attachFiles([attachment])
      .setThumbnail(`attachment://finished.png`)
      .setColor('#1fff4b').
      setAuthor(`Espelhar servidor principal!`, `https://i.imgur.com/Zipebd2.gif`).
      setDescription(`
     
    Verificamos que você escolheu a opção Servidor de **Atendimento**, para facilitar você pode copiar os dados já cadastrados do seu servidor principal,
    porém ele deve está __**configurado previamente**__!
     
     \`\`\`json\n🧐 Vamos-lá digite o ID do seu servidor principal!\`\`\`
 
     `).setFooter('Obs: Você só pode colocar o ID do seu servidor principal ok 😉?').setImage(`https://minecraftskinstealer.com/achievement/30/Espelhamento%21/Copiar+do+principal%21`);
    if (this.message) this.message.delete().then(() => { }).catch(() => { });
    if (!this.channel) return;
    this.message = await this.channel.send(embed)

    this._pageLock = false;

    const collector = this.channel.createMessageCollector(a => a.author.id == this.user.id);

    collector.on('collect', async (message: Message) => {
      await Bot.instance.client.guilds.fetch(message.content, true).then(async g => {
        const guildToHook = await this.instanceSettings.getCache(g.id);
        if (guildToHook.guilds.attendance != this.guild.id) {
          this.processInformation(collector, message, g.id, `Copiar deste dados deste servidor: ${g.name} (Tem certeza?)`, true);
        } else {
          message.reply(`📌 O ID desse servidor deste está cadastrado como servidor de atendimento no principal ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        }
      }).catch(async () => {
        message.reply(`📌 Coloque um ID de um servidor que já possua nosso bot ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
        message.delete();
      });
    });

    this.message.react('❌')
    if (this.currentOffset > 0) {
      this.message.react('⬅️')
    }
  }

  public async generateTab() {

    this.lastAction = Date.now();

    if (this.currentOffset > this.maxReach) {
      this.maxReach = this.currentOffset;
    }
    if (!this.missingData) {
      this.missingData = await this.instanceSettings.listMissingData(this.guild.id);
    }
    if (!this.missingDataTranslated) {
      this.missingDataTranslated = this.instanceSettings.missingDataTranslated;

    }
    if (this.currentOffset >= this.missingData.length) {
      this.preSaveProgress();
      return;
    }

    this.currentKey = this.missingData[this.currentOffset];
    const image = await nodeHtmlToImage({
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      transparent: true,
      html: buildProgressiveCircle(Math.round((this.currentOffset / this.missingData.length) * 100))
    });

    const attachment = new MessageAttachment(image as Buffer, `a.png`);

    let collectorFunction: any
    let embed: any;

    if (this.currentKey == 'type') {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
     
     Para dar início ao processo de configuração, precisamos conhecer um pouco do seu servidor :smile:!
     
     \`\`\`json\n🧐 Vamos-lá, nos diga por favor o tipo deste servidor na sua rede:\`\`\`
 
     `).setFooter('Obs: Os tipos disponíveis são apenas principal e atendimento ok 😉?').setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);
      collectorFunction = async (collector: MessageCollector, message: Message) => {
        switch (message.content.toLowerCase()) {
          case 'principal':
          case 'atendimento':
            this.processInformation(collector, message, message.content.toUpperCase(), '> Tipo escolhido: $content (Tem certeza?)');
            break;
          default:
            message.reply(`📌 Os tipos disponíveis são apenas **principal e atendimento** ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
            message.delete();
            break;
        }
      }
    } if (this.currentKey == 'captchaType') {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
   
   Para dar início ao processo de configuração, precisamos conhecer um pouco do seu servidor :smile:!
   
   \`\`\`json\n🧐 Vamos-lá, nos diga por favor o tipo de captcha que você quer usar na sua rede:\`\`\`

    **Exemplo do tipo de captcha __advanced__**: [Clique aqui!](https://prnt.sc/153bwsv)
        
   `).setFooter('Obs: Os tipos disponíveis são apenas standard e advanced ok 😉?').setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);
      collectorFunction = async (collector: MessageCollector, message: Message) => {
        switch (message.content.toLowerCase()) {
          case 'standard':
          case 'advanced':
            this.processInformation(collector, message, message.content.toLowerCase(), '> Tipo escolhido: $content (Tem certeza?)');
            break;
          default:
            message.reply(`📌 Os tipos disponíveis são apenas **standard e advanced** ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
            message.delete();
            break;
        }
      }
    } else if (this.currentKey == 'ip' || this.currentKey == 'name') {

      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
     
     Para dar início ao processo de configuração, precisamos conhecer um pouco do seu servidor :smile:!
     
    \`\`\`json\n🧐 ${this.currentKey == 'ip' ? `Vamos-lá, nos diga por favor o: ip da sua rede de servidores` : `Vamos-lá, nos diga por favor: o nome do seu servidor`}\`\`\`
 
     `).setFooter(`${this.currentKey == 'ip' ? `Obs: Coloque o endereço principal do seu servidor ok 😉?` : `Obs: Coloque o nome que você deseja que apareça nas mensagem e derivados ok 😉?`}`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);
      collectorFunction = (collector: MessageCollector, message: Message) => {
        this.processInformation(collector, message, message.content, this.currentKey == 'ip' ? '> Endereço principal escolhido: $content (Tem certeza?)' : '> Nome do servidor escolhido: $content (Tem certeza?)');
      }
    }
    else if (this.currentKey == 'shop') {

      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
     
     Para dar início ao processo de configuração, precisamos conhecer um pouco do seu servidor :smile:!
     
    \`\`\`json\n🧐 Vamos-lá, nos diga por favor: o endereço da loja do seu servidor.\`\`\`
 
     `).setFooter(`Coloque o endereço principal do sua loja ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);
      collectorFunction = (collector: MessageCollector, message: Message) => {
        this.processInformation(collector, message, message.content, `Endereço da loja: $content (Tem certeza?)`);
      }
    }
    else if ((this.currentKey as string).startsWith('guilds.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
   
   Para dar continuação ao processo de configuração, precisamos conhecer um pouco dos seus servidores :smile:!
   
   \`\`\`json\n🧐Vamos-lá, nos diga por favor o ID do: ${this.missingDataTranslated[this.currentKey]}\`\`\`

   `).setFooter(`Obs: Coloque um ID de um servidor que ja possua nosso bot ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);

      collectorFunction = async (collector: MessageCollector, message: Message) => {
        await Bot.instance.client.guilds.fetch(message.content, true).then(g => {
          this.processInformation(collector, message, message.content, `ID do ${this.missingDataTranslated[this.currentKey]}: $content (Tem certeza?)`);
        }).catch(async () => {
          message.reply(`📌 Coloque um ID de um servidor que já possua nosso bot ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        });
      }

    } else if ((this.currentKey as string).startsWith('category.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
   
   Para dar continuação ao processo de configuração, precisamos conhecer um pouco das suas categorias :smile:!
   
   \`\`\`json\n🧐Vamos-lá, nos diga por favor o ID ou mencione a: ${this.missingDataTranslated[this.currentKey]}\`\`\`

   `).setFooter(`Obs: Você pode mencionar uma categoria ou até mesmo colocar o ID de uma que já existe ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);

      collectorFunction = async (collector: MessageCollector, message: Message) => {
        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.find(channel => true);
        } else {
          channel = this.guild.channels.cache.find((channel) => channel.id == message.content);
        }
        if (channel) {
          this.processInformation(collector, message, channel.id, `${this.missingDataTranslated[this.currentKey]}: <#$content> (Tem certeza?)`);
        } else {
          message.reply(`📌 Mencione uma categoria ou coloque o de uma ID que exista ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        }
      }

    } else if ((this.currentKey as string).startsWith('channels.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
   
   Para dar continuação ao processo de configuração, precisamos conhecer um pouco dos seus canais :smile:!
   
   \`\`\`json\n🧐Vamos-lá, nos diga por favor o ID ou mencione do: ${this.missingDataTranslated[this.currentKey]}\`\`\`
   **Obs: S.A significa __Servidor de atendimento!__**

   `).setFooter(`Obs: Você pode mencionar um canal ou até mesmo colocar o ID de um que já existe ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);

      collectorFunction = async (collector: MessageCollector, message: Message) => {

        let channel;
        if (message.mentions.channels.size > 0) {
          channel = message.mentions.channels.find(channel => true);
        } else {
          channel = this.guild.channels.cache.find((channel) => channel.id == message.content);
        }
        if (channel) {
          this.processInformation(collector, message, channel.id, `${this.missingDataTranslated[this.currentKey]}: <#$content> (Tem certeza?)`);
        } else {
          message.reply(`📌 Mencione um canal ou coloque o de um ID que exista ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        }

      }
    } else if ((this.currentKey as string).startsWith('roles.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
   
   Para dar continuação ao processo de configuração, precisamos conhecer um pouco dos seus canais :smile:!
   
   \`\`\`json\n🧐Vamos-lá, nos diga por favor o ID ou mencione o: ${this.instanceSettings.missingDataTranslated[this.currentKey]}\`\`\`
   `).setFooter(`Obs: Você pode mencionar um cargo ou até mesmo colocar o ID de um que já existe ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);

      collectorFunction = async (collector: MessageCollector, message: Message) => {
        let roles;
        if (message.mentions.roles.size > 0) {
          roles = message.mentions.roles.find(channel => true);
        } else {
          roles = this.guild.roles.cache.find((channel) => channel.id == message.content);
        }
        if (roles) {
          this.processInformation(collector, message, roles.id, `${this.instanceSettings.missingDataTranslated[this.currentKey]}: <@&$content> (Tem certeza?)`);
        } else {
          message.reply(`📌 Mencione um cargo ou coloque o de um ID que exista ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        }
      }
    } else if ((this.currentKey as string).startsWith('messages.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`
 
 Para dar continuação ao processo de configuração, precisamos saber os IDs das mensagens dinâmicas do servidor :smile:!
 
 \`\`\`json\n🧐Vamos-lá, nos diga por favor o ID da: ${this.instanceSettings.missingDataTranslated[this.currentKey]}\`\`\`
 `).setFooter(`Obs: Você deve colocar o ID de uma mensagem que já exista ok 😉?`).setImage(`https://minecraftskinstealer.com/achievement/19/Agora+%C3%A9+sua+vez%21/Digite+o+que+se+pede+%3AD`);
      const guildSettings = await this.instanceSettings.getCache(this.guild.id);
      collectorFunction = async (collector: MessageCollector, message: Message) => {
        let channelToFetch: String;
        if ((this.currentKey as string).includes('attendancePainel')) {
          if (this.obj.channels)
            channelToFetch = this.obj.channels.attendancePainel;
          else
            channelToFetch = guildSettings.channels.attendancePainel;

        } else if ((this.currentKey as string).includes('captcha')) {
          if (this.obj.channels)
            channelToFetch = this.obj.channels.captcha;
          else
            channelToFetch = guildSettings.channels.captcha;
        } else {
          if (this.obj.channels)
            channelToFetch = this.obj.channels.welcome;
          else
            channelToFetch = guildSettings.channels.welcome;
        }
        if (channelToFetch) {
          const channel = this.guild.channels.cache.find(c => c.id == channelToFetch) as TextChannel;

          channel.messages.fetch(message.content, false).then(m => {
            this.processInformation(collector, message, message.content, `ID do ${this.missingDataTranslated[this.currentKey]}: $content (Tem certeza?)`);
          }).catch(async ignore => {
            message.reply(`📌 Coloque um de uma mensagem que já exista ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
            message.delete();
          })
        } else {
          message.reply(`📌 Ocorreu um erro inesperado tente retornar uma página ou reiniciar o registro.`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
          message.delete();
        }
      }

    } else if ((this.currentKey as string).startsWith('messages_content.')) {
      embed = new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#1fff4b').
        setAuthor(`${(this.currentOffset / this.missingData.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://i.imgur.com/qK2TuTI.gif`).
        setDescription(`

Para dar continuação ao processo de configuração, você precisa configurar algumas mensagens :smile:!

\`\`\`json\n🧐Vamos-lá, nos mande como você quer a: ${this.instanceSettings.missingDataTranslated[this.currentKey]}\`\`\`

**Aqui estão alguns placeholders que você pode usar:**
`)
        .addField('${username}', 'Nome do usuário.', true)
        .addField('${discriminator}', 'O após # do usuário.', true)
        .addField('${currentDate}', 'Horário atual traduzido.', true)
        .addField('${serverName}', 'Nome do servidor.', true)
        .addField('${serverId}', 'ID do servidor.', true)
        .addField('${userAvatar}', 'URL do avatar do usuário', true)
        .addField('${serverIcon}', 'URL do ícone do servidor.', true)
        .addField('${userId}', 'ID do usuário.', true).addField(`Requisitos`, `**Mensagem simples**: texto padrão
        **Mensagem como embed e etc**: Formato de início \`\`\`json na mensagem! [Clique para criar um!](https://embedbuilder.nadekobot.me)`, false)


        .setFooter(`Obs: Você deve pode mandar um texto ou .json ok 😉?`);

      collectorFunction = async (collector: MessageCollector, message: Message) => {

        if (message.content.startsWith('```json\n') && message.content.endsWith('\n```')) {
          try {
            const extractedJSON = ('start' + message.content + 'end').replace('start```json\n', '').replace('\n```end', '');
            const json = JSON.parse(extractedJSON);
            this.processInformation(collector, message, json, `${this.instanceSettings.missingDataTranslated[this.currentKey]}: \`\`\`json\n${JSON.stringify(json)}\`\`\`(Formato JSON) (Tem certeza?)`);

          } catch (err) {
            message.reply(`📌 A mensagem enviada se começar com  \`\`\`json deve obedecer o formator JSON ok 😉?`).then(async message => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
            message.delete();
          }
        } else {
          this.processInformation(collector, message, message.content, `${this.instanceSettings.missingDataTranslated[this.currentKey]}: $content (Tem certeza?)`);

        }
      }

    }

    if (collectorFunction != undefined && embed != undefined) {
      if (this.message) this.message.delete().then(() => { }).catch(() => { });
      this.message = await this.channel.send(embed)

      this._pageLock = false;

      const collector = this.channel.createMessageCollector(a => a.author.id == this.user.id);

      collector.on('collect', async (message: Message) => {
        await collectorFunction(collector, message);
      });
      this.message.react('❌')
      if (this.currentOffset > 0) {
        if (this.obj_dot[this.missingData[this.currentOffset - 1]])
          this.message.react('⬅️')
      }
      if (this.currentOffset < this.missingData.length) {
        if (this.obj_dot[this.missingData[this.currentOffset + 1]] || this.maxReach >= (this.currentOffset + 1))
          this.message.react('➡️')
      }

    }

  }

  public static get(id: string): Registration {
    return this.cache.get(id) as Registration
  }

  public static remove(id: string): void {
    this.cache.delete(id);
  }

  public static build(user: User, guild: Guild, channel: TextChannel): Registration {
    if (!this.cache.has(guild.id)) {
      this.cache.set(guild.id, new Registration(user, guild, channel));
    }

    return this.cache.get(guild.id) as Registration;

  }
  public get user() { return this._user; }
  public get guild() { return this._guild; }
  public get channel() { return this._channel; }

  public get pageLock() { return this._pageLock; }

  setPageLock(pageLock: boolean) { this._pageLock = pageLock; }

  public static async fetchMessages() {
    (await SettingsCache.instance().list(true)).forEach(async (settings: any, key: any) => {
      const guild = Bot.instance.client.guilds.cache.get(key);
      if (!guild) return;
      const commandIssues = await new IssueManager(guild).finder().issues(async (obj, objs) => {
        if (!(Bot.instance.client.guilds.cache.get(key)?.channels.cache.get(settings.channels.captcha) as TextChannel)) {
          objs.push('channels.captcha', 'messages.captcha');
          obj = Object.assign(obj, {
            channels: {
              captcha: null
            }, messages: {
              captcha: null
            }
          });
        } else {
          const messages = await (Bot.instance.client.guilds.cache.get(key)?.channels.cache.get(settings.channels.captcha) as TextChannel)
            .messages.fetch(settings.messages.captcha);
          if (!messages) {
            objs.push('messages.captcha');
            obj = Object.assign(obj, {
              channels: {
                captcha: null
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


      if (settings.messages.captcha) {
        (Bot.instance.client.guilds.cache.get(key)?.channels.cache.get(settings.channels.captcha) as TextChannel).messages.fetch(settings.messages.captcha);
      }

    })

  }

}