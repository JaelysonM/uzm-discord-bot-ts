import { Guild, GuildMember, MessageEmbed, Snowflake, TextChannel } from "discord.js";
import { sendMessageAndDelete } from "../utils/MessageUtils";
import Bot from "./Bot";


export interface ITicket {
  readonly guild: Guild;
  readonly member: GuildMember;
  readonly type: CaptchaType;
}
export type CaptchaType =
  | 'advanced'
  | 'standard'
export default class Captcha {


  public static get cache(): Map<Snowflake, Captcha> { return this._cache; };

  private static _cache: Map<Snowflake, Captcha> = new Map<Snowflake, Captcha>();


  private _member: GuildMember;
  private _guild: Guild;
  private _type: CaptchaType;
  private _channel: TextChannel;
  constructor(member: GuildMember, guild: Guild, channel: TextChannel, type: CaptchaType,) {
    this._member = member;
    this._guild = guild;
    this._type = type;
    this._channel = channel;
  }

  public async init(): Promise<Boolean> {
    const settings = await Bot.fromHandler('settings').getCache(this.guild.id);
    if (this.type == 'standard') {
      this.computeCaptcha(settings);
      return true;
    } else {
      try {
        await this.member.user.send(new MessageEmbed().setThumbnail('https://i.imgur.com/WEBsTtU.gif').setTitle('Verificação básica de conta!').setColor('#00f7ff')
          .setDescription(`Você completou a verificação simples no servidor.
          Porém este servidor tem uma verificação extra habilitada, portanto, 
          será necessário você registrar uma conta do **Minecraft**, para prosseguir.
          
          \`\`\`json\n✔️ Use: ${settings.commandPrefix}registrar <Nickname do Minecraft> | Registra um nickname em sua conta do Discord.\`\`\`

          `));
      } catch (err) {
        sendMessageAndDelete(this._channel, new MessageEmbed().setThumbnail('https://i.imgur.com/WEBsTtU.gif').setTitle('Verificação básica de conta!').setColor('#00f7ff')
          .setDescription(`<@${this.member.id}> você completou a verificação simples no servidor.
        Porém este servidor tem uma verificação extra habilitada, portanto, 
        será necessário você registrar uma conta do **Minecraft**, para prosseguir.
        
        \`\`\`json\n✔️ Use: ${settings.commandPrefix}registrar <Nickname do Minecraft> | Registra um nickname em sua conta do Discord.\`\`\`
        `), 10000);
      }
      return true;
    }
  }

  public async computeCaptcha(settings: any) {
    Captcha.remove(this.member.id)
    await this._member.roles.add(settings.roles.member);
    const user = this._member.user;
    try {
      await user.send(new MessageEmbed().setThumbnail('https://media3.giphy.com/media/chiLb8yx7ZD1Pdx6CF/giphy.gif').setTitle('Verificado!').setColor('#00f7ff')
        .setDescription(`***Você completou a verificação no servidor.***
  A partir deste momento você tem acesso a todos os canais do servidor disponível para membros.
  
  Evite ser punido de nossos servidores, confira os canais de regras.`));
    } catch (error) { }

    if (settings.messages_content.welcome != null) {
      const replacer = (key: any, value: any) => {
        if (typeof value === 'string') {
          return value.replace('${username}', user.username)
            .replace('${discriminator}', user.discriminator).
            replace('${currentDate}', Date.now() as any)
            .replace('${serverName}', this._guild.name).
            replace('${serverId}', this._guild.id)
            .replace('${userAvatar}', user.avatarURL() as any).
            replace('${serverIcon}', this._guild.iconURL() as any).
            replace('${userId}', user.id)
        } else {
          return value;
        }
      }
      var jsonString = JSON.stringify(settings.messages_content.welcome, replacer);
      var jsonReplaced = JSON.parse(jsonString);
      if (!jsonReplaced.content! && !jsonReplaced.embed) {
        jsonReplaced = {
          content: jsonReplaced
        }
      }
      (this._guild.channels.cache.get(settings.channels.welcome) as TextChannel).send(jsonReplaced.content, { embed: jsonReplaced.embed });
      Bot.fromHandler('account').getCache(`${user.id}-${this.guild.id}`).then((account) => {
        if (account.muteTimestamp != 0 && account.muteTimestamp > Date.now()) this.member.roles.add(settings.roles.muted);
      });
    }
  }

  public get member() { return this._member; }
  public get guild() { return this._guild; }
  public get type() { return this._type; }

  public static get(id: string): Captcha {
    return this.cache.get(id) as Captcha
  }

  public static remove(id: string): void {
    this.cache.delete(id);
  }
  public static build(member: GuildMember, guild: Guild, channel: TextChannel, type: CaptchaType): Captcha {
    if (!this.cache.has(member.id)) {
      this.cache.set(member.id, new Captcha(member, guild, channel, type));
    }

    return this.cache.get(member.id) as Captcha;

  }

}