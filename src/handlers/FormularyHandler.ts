import { Guild, Message, MessageAttachment, MessageEmbed, PartialUser, Role, Snowflake, User } from "discord.js";
import nodeHtmlToImage from "node-html-to-image";
import Bot from "../containers/Bot";
import { buildProgressiveCircle } from "../html/ImageCreator";
import TimeFormatter from "../utils/TimeFormatter";

interface IFormularyHandler {
  idleFormsCleaner(): void;
  destroyFormulary(user?: User | undefined, save?: boolean): Promise<void>,
  formularyConfirmation(): Promise<void>,
  formularyGenerateTab(action?: FormularyAction): Promise<void>,
  user: User,
  guild: Guild,
}

export interface IFormularyQuestion {
  ask: string,
  description: string,
  obligated?: boolean,
}
export interface IFormularyResponse {
  response: string,
  timestamp: Number,
}

export interface FormularyAction {
  tabAction: FormularyTabAction
}

export interface FormularyKey {
  user: User,
  guild: Guild
}

export interface FormularyResult {
  recruiter: User,
  recruited: User,
  response: {
    result: | 'approved'
    | 'reproved',
    reason?: string,
    formularyInstance: FormularyHandler
  }
}

export type FormularyTabAction = | 'next'
  | 'previous'
  | 'reset' | 'idle'

export default abstract class FormularyHandler implements IFormularyHandler {

  private static cache: Map<Snowflake, FormularyHandler> = new Map<Snowflake, FormularyHandler>();

  _user: User;
  _guild: Guild;
  _prize: string | undefined | Role;

  offset: number = 0;
  maxOffset: number = 0;
  questions: IFormularyQuestion[] = [];
  responsesRegistry: String[] = [];

  idleRegistry: number = Date.now();

  timeMakingFormulary: number = Date.now();

  mainMessage: Message | undefined;

  responses: Map<String, IFormularyResponse> = new Map<String, IFormularyResponse>();

  settingCache: Object | any = {};
  accountCache: Object | any = {};

  protected idleFormsCleanerTask: NodeJS.Timeout | any;

  public get user() { return this._user; }
  public get guild() { return this._guild; }

  constructor(guild: Guild, user: User, prize: string | undefined) {
    this._guild = guild; this._user = user; this._prize = prize;

    (async () => {
      this.settingCache = await Bot.fromHandler('settings').getCache(this.guild.id);
      this.accountCache = await Bot.fromHandler('account').getCache(`${this.user.id}-${this.guild.id}`);

      this.idleFormsCleanerTask();

      this.responsesRegistry.push(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-\nArquivo de formulário criado automaticamente pelo uzm-discord-bot\n           Autor: Uzm Studio Inc.\n          Licenciado para o servidor ${this.guild.name}\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-
    
      A ser ofertado: ${this._prize instanceof Role ? `Cargo ${this._prize.name}` : this._prize}
      Nome do usuário no Discord: ${this.user.username}#${this.user.discriminator}
    Nome no minecraft cadastrado: ${this.accountCache.minecraft.nickname || `Não encontrado...`}
    Conta original(Segundo seu cadastro): ${this.accountCache.minecraft.uuid ? `Sim` : `Não`}
    Iniciado em: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())} \n\n------------------------------------------------------------------
      `)

      await this.formularyGenerateTab({
        tabAction: 'idle'
      })
    })();
  }

  idleFormsCleaner() {
    this.idleFormsCleanerTask = setInterval(async () => {
      if (this.idleRegistry > 0) {
        if ((this.idleRegistry + 1000 * 60 * 5) <= Date.now()) {
          await this.destroyFormulary();
        }
      }
    }, 1000)
  }
  async destroyFormulary(user?: User | undefined, save?: boolean): Promise<void> {

    clearInterval(this.idleFormsCleanerTask);
    FormularyHandler.deleteFormulary(this._user)
    if (!!this.mainMessage) try { await this.mainMessage.delete(); } catch (error) { }

  }
  async formularyConfirmation(): Promise<void> {
    this.offset = this.questions.length;

    const attachment = new MessageAttachment(await this.getImageFromHtml() as Buffer, `ring.png`);


    if (!!this.mainMessage) try { await this.mainMessage.delete(); } catch (error) { }

    try {
      this.mainMessage = await this.user.send(
        new MessageEmbed()
          .attachFiles([attachment])
          .setThumbnail(`attachment://ring.png`)
          .setColor('#1fff4b')
          .setAuthor(`Finalmente terminamos 😉!`, `https://i.imgur.com/gntqLpd.gif`)
          .setDescription(`

          Para finalizar o formulário precisamos da sua confirmação :smile:!

          \`\`\`json\n🧐 Vamos-lá, para finalizar clique em ✅!\`\`\`

           `)
          .setFooter(`Formulário quase finalizado: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
          .setImage(`https://minecraftskinstealer.com/achievement/2/Processo+conclu%C3%ADdo%21/Deseja+finalizar%3F`))

      this.mainMessage.react('✅')
      this.mainMessage.react('❌')
      this.mainMessage.react('⬅️')

    } catch (err) {
      this.destroyFormulary(this.user, false);
    }
  }
  async formularyGenerateTab(action: FormularyAction): Promise<void> {

    switch (action.tabAction) {
      case 'next': this.offset += 1;
      case 'previous': this.offset -= 1;
      case 'reset': this.offset = 0;
    }

    this.idleRegistry = Date.now();
    if (this.offset > this.maxOffset) this.maxOffset = this.offset;

    if (this.offset < this.questions.length) {

      const attachment = new MessageAttachment(await this.getImageFromHtml() as Buffer, `ring.png`);

      if (!!this.mainMessage) try { await this.mainMessage.delete(); } catch (error) { }

      const { ask, description, obligated } = this.questions[this.offset];

      try {
        this.mainMessage = await this.user.send(
          new MessageEmbed()
            .attachFiles([attachment])
            .setThumbnail(`attachment://ring.png`)
            .setColor('#353536')
            .setAuthor(`${(this.offset / this.questions.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://emoji.gg/assets/emoji/4327_5000_BITS_TWITCH_DONATE.gif`)
            .setDescription(`Fique a vontade para digitar o que quiser, porém não exagere nas palavras iremos avaliar tudo durante o processo de seleção.
            
            __* Obrigatória__

            \`\`\`json\n${ask}${obligated ? `*` : ``}\`\`\`${description ? `\n\n**Nota da equipe**: ${description}` : ``}
            
            **Nota importante: Demora um pouco para computar sua resposta certa de 1-5 segundos**${!!this._prize ? `\n\nA ser ofertado: ${this._prize instanceof Role ? `Cargo ${this._prize.name}` : this._prize}` : ``}
            `)
            .setFooter(`Pergunta ${this.offset + 1}/${this.questions.length}`)
            .setImage(`https://minecraftskinstealer.com/achievement/17/Formul%C3%A1rios%21/Responda+se+poss%C3%ADvel%21`))



        if (!!this.user.dmChannel) {

          this.mainMessage.react('❌')
          if (this.offset > 0) this.mainMessage.react('⬅️')
          if (this.offset < this.questions.length) if (!obligated || this.responses.has(ask)) this.mainMessage.react('➡️')

          this.user.dmChannel.awaitMessages(a => a.author.id == this.user.id, { max: 1, time: 30000, errors: ['time'] })
            .then(collected => {
              this.responses.set(ask, {
                response: collected.first()?.content || 'Não respondida corretamente.',
                timestamp: Date.now() - this.idleRegistry
              })
              this.responsesRegistry.push(`[${new Date(Date.now()).toUTCString()}] Ação de pergunta:
              Pergunta: ${ask}
              Resposta: ${collected.first()?.content || 'Não respondida corretamente.'}
              
              Estatísticas:
               Respondida em: ${TimeFormatter.BR_TIMER.format(Date.now() - this.idleRegistry)}
               É obrigatória: ${obligated ? `Sim` : 'Não'}
               `);
              this.formularyGenerateTab({
                tabAction: 'next'
              })
            })
            .catch(_collected => {
              this.formularyGenerateTab({
                tabAction: 'idle'
              })
            });
        } else {
          throw new Error(`Cannot send messages to this user, closed DM!`)
        }
      } catch (err) {
        this.destroyFormulary(this.user, false);
      }
    } else {
      this.formularyConfirmation();
    }
  }

  public static getFormulary(user: User | PartialUser): FormularyHandler | undefined {
    return this.cache.get(`${user.id}`)
  }

  public static deleteFormulary(user: User) {
    this.cache.delete(`${user.id}`)
  }

  public static createFormulary(user: User, formularyInstance: FormularyHandler): FormularyHandler | undefined {
    if (!this.cache.has(`${user.id}`)) this.cache.set(`${user.id}`, formularyInstance);
    return FormularyHandler.getFormulary(user)
  }
  protected async getImageFromHtml(): Promise<string | Buffer | (string | Buffer)[]> {
    return await nodeHtmlToImage({
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      transparent: true,
      html: buildProgressiveCircle(Math.round((this.offset / this.questions.length) * 100))
    });
  }
}