import { Guild, Message, MessageEmbed, TextChannel } from "discord.js";
import Bot from "../containers/Bot";
import SettingsCache from "../database/cache/SettingsCache";
import { sendMessageAndDelete } from "../utils/MessageUtils";
import TimeFormatter from "../utils/TimeFormatter";

export default class IssueManager {

  private _guild: Guild;
  private settings: any;
  private _finder: Finder;

  public get guild(): Guild { return this._guild }

  constructor(guild: Guild) {
    this._guild = guild;
    this._finder = new Finder(this);
    this.init();
  }
  public async init() {
    this.settings = await Bot.fromHandler('settings').getCache(this.guild.id);
  }

  protected async dataRefactor(object: any, missing: String[]): Promise<{
    missing: String,
    settings: any,
  }> {
    const settings = await Bot.fromHandler('settings').getCache(this.guild.id);
    object.configured = false;
    await Bot.fromHandler('settings').updateCache(this.guild.id, object, true);
    if (missing.length == 0) { return { missing: `\`\`\`css\n[Não há missing-data]\`\`\``, settings: settings } }
    if (missing.length <= 5) {
      return {
        missing: `\`\`\`json\n${missing.map((key: any) => `✔ "${(Bot.fromHandler('settings') as SettingsCache).missingDataTranslated[key as string]}"`).join('\n')}\`\`\``,
        settings: settings
      }
    } else {
      return {
        missing: `\`\`\`json\n${missing.slice(0, 5).map((key: any) => `✔ "${(Bot.fromHandler('settings') as SettingsCache).missingDataTranslated()[key as string]}"`).join('\n')}\n\noutros ${missing.length - 5}...\`\`\``,
        settings: settings,

      }
    }
  }

  public notReadyEmbed(channel: TextChannel) {
    sendMessageAndDelete(channel, new MessageEmbed().
      setDescription(
        `Verificamos no banco de dados do ** Bot ** que este servidor não está
    está completamente configurado, isto é, alguns valores como cargos, canais
    e servidores não foi definidos corretamente.

    ** __Obs__: Se possível contate um administrador.**

    \`\`\`json\n✔️ Use: ${this.settings.commandPrefix}register | Inicia um painel de registro inicial, para que após isso você libere este bot no servidor.\`\`\`
`,).
      setColor('NAVY').
      setAuthor(`Painel de controle do bot - Configurações insuficientes.`, `https://i.imgur.com/KIGhUTY.gif`).
      setImage('https://minecraftskinstealer.com/achievement/6/Painel+de+controle/N%C3%A3o+configurado%21').
      setFooter(`Painel de configuração rápida iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 12000);
  }
  public async alert(args: String[], newObject: any) {
    const { missing, settings } = await this.dataRefactor(newObject, args);
    try {
      this.guild.owner?.createDM(true);
      this.guild.owner?.send(new MessageEmbed().
        setDescription(
          `Verificamos no banco de dados do ** Bot ** que alguns cargos, canais ou servidores possivelmente foram deletados e para evitar falhas ou erros travamos e ele só irá voltar após a reconfiguração.
  
        __E estes são__:
        ${missing}
  
   ** __Obs__: Assim que você registrar novamente esses dados faltosos ele voltará a funcionar.**
   ** __Obs²__: Fazemos isso para evitar potenciais erros.**
  
        \`\`\`json\n✔️ Use: ${settings.commandPrefix}register | Inicia um painel de registro inicial, para que após isso você libere este bot no servidor.\`\`\`
  `,).
        setColor('NAVY').
        setAuthor(`Sistema de prevenção de falhas - Configurações inválidas.`, `https://i.imgur.com/KIGhUTY.gif`).
        setImage('https://minecraftskinstealer.com/achievement/6/Painel+de+controle/Prevenção+de+falhas!').
        setFooter(`Usuário notificado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
    } catch (err) { }
  }
  public finder(): Finder {
    return this._finder;
  }


}
export class Finder {
  private manager: IssueManager;
  constructor(manager: IssueManager) {
    this.manager = manager;
  }
  async run(consumer: (obj: any, objs: String[]) => Promise<void>) {
    let obj: any = {};
    let objs: String[] = [];

    await consumer(obj, objs);
    if (Object.keys(obj).length > 0 && objs) {
      this.manager.alert(objs, obj)
      return true;
    }
    return false;
  }
  async issues(issueConsumer?: (obj: any, objs: String[]) => Promise<void>, consumer: (settings: any) => boolean = (settings: any) => false) {
    return this.commandIssues(undefined, issueConsumer, consumer);
  }
  async commandIssues(message?: Message | undefined, issueConsumer?: (obj: any, objs: String[]) => Promise<void>, consumer: (settings: any) => boolean = (settings: any) => false) {
    const ready = await (Bot.fromHandler('settings') as SettingsCache).isReady(this.manager.guild.id);
    if (!ready) {
      if (message)
        this.manager.notReadyEmbed(message.channel as TextChannel)
      return true;
    };
    const settings = await Bot.fromHandler('settings').getCache(this.manager.guild.id);
    const checker = await consumer(settings);
    if (checker) return true;
    if (!issueConsumer) return true;
    const run = await this.run(issueConsumer);

    if (run) return true;
    return false;
  }
}