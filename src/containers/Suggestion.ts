import { Guild, Message, MessageAttachment, MessageEmbed, Snowflake, TextChannel, User } from "discord.js";
import nodeHtmlToImage from "node-html-to-image";
import { buildProgressiveCircle } from "../html/ImageCreator";
import TimeFormatter from "../utils/TimeFormatter";
import TimeUnit from "../utils/TimeUnit";
import Bot from "./Bot";



export default class Suggestion {

  public static get cache(): Map<Snowflake, Suggestion> { return this._cache; };

  private static _cache: Map<Snowflake, Suggestion> = new Map<Snowflake, Suggestion>();
  private _user: User;
  private _guild: Guild;
  public currentOffset: number = -1;
  private message: Message | any;
  private maxReach: number = 0;
  private lastAction: number = 0;
  private formTimeOffset: number = Date.now();
  private taskId: any;
  public forms: any[] = [];
  private asks: any = {}
  private account: any;
  constructor(user: User, guild: Guild) {
    this._user = user;
    this._guild = guild;
  }


  public async init() {
    const settings = await Bot.fromHandler('settings').getCache(this.guild.id);
    this.forms = [
      {
        ask: 'O tópico da sua sugestão?',
        description: 'Precisamos de um tópico para melhor ordenar-lás',
        obligated: true,
      }, {
        ask: 'Para onde seria?',
        description: 'Perguntamos isso para direcionar as informações para os devidos setores.',
        obligated: true,
      }, {
        ask: 'Explique tudo o que você sugere:',
        description: 'Seja criativo e detalhista na sua explicação.',
        obligated: true,
      },
    ];
    this.account = await Bot.fromHandler('account').getCache(`${this.user.id}-${this.guild.id}`)
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
    Suggestion.remove(`${this.user.id}-${this.guild.id}`);
    clearInterval(this.taskId);
    const settings = await Bot.fromHandler('settings').getCache(this.guild?.id as string);
    if (this.message) {
      try {
        this.message.delete();
      } catch (err) { }
    }

    if (this.user) {
      let embed;
      if (!save) {
        embed = new MessageEmbed().setAuthor(`Sugestão - ${this.guild.name}!`, `https://i.imgur.com/sqj929K.gif`).setDescription(`
        Seu formulário de sugestão foi cancelado ${user == undefined ? `por ultrapassar 10 minutos de inatividade!` : `por você!`}. Caso queira refazer digite \`\`/sugestão\`\` em qualquer chat do servidor.
        
       Pedimos que se tenha feito isso sem querer, tome cuidado na próxima vez, pois após o cancelamento todo o progresso é perdido.`);

      } else {

        embed = new MessageEmbed().setColor('#fbff00').setImage(`https://minecraftskinstealer.com/achievement/7/Obrigado%21/Isso+ajuda+muito%21`).setAuthor(`Formulário finalizado! - ${this.guild.name}!`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`)
          .setDescription(`
     
         Seu formulário de sugestão foi **concluído**! Uhuuuuu 🥳!
         
         Agradecemos pela sua paciência e colaboração durante todo esse processo que, convenhamos, é um pouco chato, mas não se preocupe o resto é com a gente 😉!

         **Servidor para qual foi feito**: ${this.guild.name}
         **Tópico:**: ${(Object.values(this.asks)[0] as any).response}
         **Tempo de formulário**: ${TimeFormatter.BR_TIMER.format(Date.now() - this.formTimeOffset)}
         **Perguntas respondidas**: ${Object.values(this.asks).length}/${this.forms.length}
    
         `).setFooter(`Nós da equipe do servidor agradecemos sua contribuição 💛!`)
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

        try {
          const channel = this.guild.channels.cache.find(c => c.id == settings.channels.suggestions) as TextChannel;
          if (channel) {
            const m = await channel.send(new MessageEmbed()
              .setAuthor(`${this.user.username}#${this.user.discriminator} - Novo formulário de sugestão!`
                , `https://i.imgur.com/sqj929K.gif`).setColor('#fbff00').setThumbnail(`${this.account.minecraft.nickname ? `https://minotar.net/avatar/${this.account.minecraft.nickname}` : `https://previews.123rf.com/images/kaymosk/kaymosk1804/kaymosk180400006/100130939-error-404-page-not-found-error-with-glitch-effect-on-screen-vector-illustration-for-your-design-.jpg`}`)
              .setDescription(`|| @everyone ||\nNome de usuário no jogo: **${this.account.minecraft.nickname || 'Não encontrado...'}**\nTempo de formulário: **${TimeFormatter.BR_TIMER.format(Date.now() - this.formTimeOffset)}**\nPerguntas respondidas: **${Object.values(this.asks).length}/${this.forms.length}**`)
              .addField(`Tópico`, `\`\`\`${(Object.values(this.asks)[0] as any).response}\`\`\``).
              addField(`Para qual setor`, `\`\`\`${(Object.values(this.asks)[1] as any).response}\`\`\``)
              .addField(`Explicação`, `\`\`\`${(Object.values(this.asks)[2] as any).response}\`\`\``).
              setFooter('Sugestão enviada em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
            await m.react('👍')
            await m.react('👎')
            await m.react('🙄')
            this.user.send(embed).then(() => { }).catch(() => { });
          }
        } catch (err) {
        }
        await Bot.fromHandler('account').updateCache(`${this.user.id}-${this.guild.id}`, { suggestionTimestamp: Date.now() + TimeUnit.DAYS.toMillis(1) }, true);

      }

    }
  }
  private async preSaveProgress() {

    this.currentOffset = 100;
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
     
    Para finalizar o formulário de sugestão precisamos da sua confirmação :smile:!
     
     \`\`\`json\n🧐 Vamos-lá, para finalizar clique em ✅!\`\`\`
 
     `).setFooter(`Formulário de sugestão quase finalizado: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/2/Processo+conclu%C3%ADdo%21/Deseja+finalizar%3F`);
    if (this.message) this.message.delete().then(() => { }).catch(() => { });
    try {
      this.message = await this.user.send(embed)
    } catch (err) { }

    this.message.react('✅')
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
    if (this.currentOffset >= this.forms.length) {
      this.preSaveProgress();
      return;
    }

    const image = await nodeHtmlToImage({
      transparent: true,
      html: buildProgressiveCircle(Math.round((this.currentOffset / this.forms.length) * 100)),
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
    });

    const attachment = new MessageAttachment(image as Buffer, `a.png`);

    if (this.message) this.message.delete().then(() => { }).catch(() => { });
    let ask: string | number = '...';
    let note;
    let obligated = false;
    if (this.forms[this.currentOffset]) {
      ask = this.forms[this.currentOffset].ask;
      note = this.forms[this.currentOffset].description;
      if (this.forms[this.currentOffset].obligated) {
        obligated = this.forms[this.currentOffset].obligated;
      }
    }

    try {
      this.message = await this.user.send(new MessageEmbed()
        .attachFiles([attachment])
        .setThumbnail(`attachment://a.png`)
        .setColor('#353536').
        setAuthor(`Sugestão - ${(this.currentOffset / this.forms.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://emoji.gg/assets/emoji/4327_5000_BITS_TWITCH_DONATE.gif`).
        setDescription(`Fique a vontade para digitar o que você deseja, mas não seja desrespeitoso.

\`\`\`json\n${ask}${obligated ? ` - [OBRIGATÓRIA] ` : ``}\`\`\`${note ? `\n\n**Nota da equipe**: ${note}` : ``}

**Nota importante: Demora um pouco para computar sua resposta certa de 1-5 segundos**

 `).setFooter(`Pergunta ${this.currentOffset + 1}/${this.forms.length}`).setImage(`https://minecraftskinstealer.com/achievement/17/Formul%C3%A1rios%21/Responda+se+poss%C3%ADvel%21`))

      const collector = this.user.dmChannel?.createMessageCollector(a => a.author.id == this.user.id);
      if (collector) {
        collector.on('collect', async (message: Message) => {
          collector.stop();
          this.asks[ask] = {
            response: message.content,
            time: Date.now()
          }
          this.currentOffset += 1;
          this.generateTab();
        });
      }


      this.message.react('❌')
      if (this.currentOffset > 0) {
        this.message.react('⬅️')
      }
      if (this.currentOffset < this.forms.length) {
        if (!obligated || this.asks[ask])
          this.message.react('➡️')
      }
    } catch (err) { }



  }

  public static get(id: string): Suggestion {
    return this.cache.get(id) as Suggestion
  }

  public static remove(id: string): void {
    this.cache.delete(id);
  }

  public static build(user: User, guild: Guild): Suggestion {
    if (!this.cache.has(`${user.id}`)) {
      this.cache.set(`${user.id}`, new Suggestion(user, guild));
    }

    return this.cache.get(`${user.id}`) as Suggestion;

  }
  public get user() { return this._user; }
  public get guild() { return this._guild; }

}