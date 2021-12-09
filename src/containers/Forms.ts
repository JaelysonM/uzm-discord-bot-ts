import { Guild, Message, MessageAttachment, MessageEmbed, Snowflake, TextChannel, User } from "discord.js";
import nodeHtmlToImage from "node-html-to-image";
import { buildProgressiveCircle } from "../html/ImageCreator";
import log from "../services/logs";
import TimeFormatter from "../utils/TimeFormatter";
import Bot from "./Bot";



export default class Forms {

  public static get cache(): Map<Snowflake, Forms> { return this._cache; };

  private static _cache: Map<Snowflake, Forms> = new Map<Snowflake, Forms>();
  private _user: User;
  private _guild: Guild;
  public currentOffset: number = -1;
  private message: Message | any;
  private maxReach: number = 0;
  private lastAction: number = 0;
  private formTimeOffset: number = Date.now();
  private taskId: any;
  public forms: any[] = [];
  private asks: any = [];
  private account: any;
  private actions: any[] = [];
  private _role: string;

  constructor(user: User, guild: Guild, role: string) {
    this._user = user;
    this._guild = guild;
    this._role = role;
  }


  public async init() {
    const settings = await Bot.fromHandler('settings').getCache(this.guild.id);

    this.forms = settings.form.asks;
    this.currentOffset = 0;
    await this.generateTab();
    this.runCleanTask();
    this.account = await Bot.fromHandler('account').getCache(`${this.user.id}-${this.guild.id}`)
    this.actions.push(`-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-\nArquivo de formulário criado automaticamente pelo uzm-discord-bot\n           Autor: Uzm Studio Inc.\n          Licenciado para o servidor ${this.guild.name}\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-==-
    
    Cargo anunciado: ${this._role}
    Nome do usuário no Discord: ${this.user.username}#${this.user.discriminator}
    Nome no minecraft cadastrado: ${this.account.minecraft.nickname || `Não encontrado...`}
    Conta original (Segundo seu cadastro): ${this.account.minecraft.uuid ? `Sim` : `Não`}
    Iniciado em: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}\n\n------------------------------------------------------------------ 
    `)
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


  public static result(staff: User, status: string, target: User, form: any, reason: string) {
    try {
      if (status.toLowerCase() == 'aprovado') {
        try {
          const roleInMain = Bot.instance.client.guilds.cache.get(form.guild)?.roles.cache.find(r => r.name.toLowerCase() == form.role.toLowerCase());
          if (roleInMain) {
            Bot.instance.client.guilds.cache.get(form.guild)?.members.cache.get(target.id)?.roles.add(roleInMain)
          }
          log(Bot.instance.client.guilds.cache.get(form.guild) as Guild, 'autoRole', `${target.username} foi posto como ${form.role} através do sistema de formulários e pela aprovação de ${staff.username}.`);
        } catch (err) {
        }


        target.send(new MessageEmbed().setFooter(`O resultado da formulário foi enviado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setAuthor(`Seu formulário foi aceito!`, `https://i.imgur.com/WEBsTtU.gif`).setDescription(
          `Nossa equipe analisou seu formulário e temos uma boa notícia! **Conseguimos o aprovar para participar da nossa equipe**.
          
          Nós em nome de toda a equipe lhe damos os nossos sinceros parabéns 🤗!
          
          Agora que você é da família, antes de qualquer coisa tenha responsabilidade com o próximo e ,sobretudo, com membros da nossa equipe, você não irá se arrepender iremos lhe recompensar de acordo com o devido esforço... 🤔
          
          Você irá receber nos dois servidores [equipe e principal] o seu respectivo cargo: **${form.role}**`))

      } else {
        target.send(new MessageEmbed().setFooter(`O resultado da formulário foi enviado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setAuthor(`Seu formulário foi reprovado!`, `https://i.imgur.com/o5RTi2H.gif`)
          .setDescription(
            `Nossa equipe analisou seu formulário  e infelizmente **não conseguimos te aprovar** para participar da nossa equipe.
          
          Mas antes de tudo segue a resposta parcial dos nossos analistas: 
          \`\`${reason}\`\`\
          Sabendo disso não desista novas oportunidades surgirão e na próxima pode ser a sua vez. 🤗
        
          
          Cargo ofertado: **${form.role}**`))

      }
      Forms.remove(form.user);
      Bot.fromHandler('forms').deleteCache(form.minecraft.nickname.toLowerCase())
    } catch (error) {

    }
  }

  public async destroy(user: any = undefined, save: boolean = false) {
    Forms.remove(`${this.user.id}-${this.guild.id}`);
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
        await Bot.fromHandler('forms').deleteCache(this.account.minecraft.nickname.toLowerCase());
        embed = new MessageEmbed().setAuthor(`Formulário para aplicação - ${this.guild.name} - ${this._role}!`, `https://i.imgur.com/o5RTi2H.gif`).setDescription(`
        Seu formulário foi cancelado ${user == undefined ? `por ultrapassar 10 minutos de inatividade!` : `por você!`}. Caso queira refazer digite \`\`/formulario\`\` em qualquer chat do servidor.
        
       Pedimos que se tenha feito isso sem querer, tome cuidado na próxima vez, pois após o cancelamento todo o progresso é perdido.`);

      } else {
        embed = new MessageEmbed().setColor('#00e5ff').setImage(`https://minecraftskinstealer.com/achievement/7/Boa+sorte%21/Torcemos+por+voc%C3%AA`).setAuthor(`Formulário finalizado! - ${this.guild.name}!`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`)
          .setDescription(`
     
         Seu formulário para aplicação foi **concluído**! Uhuuuuu 🥳!
         
         Agradecemos pela sua paciência e colaboração durante todo esse processo que, convenhamos, é um pouco chato, mas não se preocupe o resto é com a gente 😉!

         **Servidor para qual foi feito**: ${this.guild.name}
         **Cargo ofertado**: ${this._role}
         **Tempo de formulário**: ${TimeFormatter.BR_TIMER.format(Date.now() - this.formTimeOffset)}
         **Perguntas respondidas**: ${this.asks.length}/${this.forms.length}
    
         `).setFooter(`Nós da equipe do servidor estamos torcendo por você 💛!`)
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
        this.actions.push(`------------------------------------------------------------------\nInformações finais:\n\n Tempo demorado: ${TimeFormatter.BR_TIMER.format(Date.now() - this.formTimeOffset)}\n Perguntas respondidas: ${this.asks.length}/${this.forms.length}\n Servidor para qual foi feito: ${this.guild.name}\n\n\nuzm-discord-bot by UzmStudio Inc. - All rights reserved [2019-2021]`)
        var buf = await Buffer.from(this.actions.join(`\n`), 'utf8');
        const attachment = new MessageAttachment(buf, `${this.user.id}_formulary.txt`);
        const channel = Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.forms) as TextChannel;
        if (channel) {
          channel.send(new MessageEmbed()
            .setAuthor(`${this.user.username}#${this.user.discriminator} - Novo formulário!`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`).setColor('#00e5ff').setThumbnail(`${this.account.minecraft.nickname ? `https://minotar.net/avatar/${this.account.minecraft.nickname}` : `https://previews.123rf.com/images/kaymosk/kaymosk1804/kaymosk180400006/100130939-error-404-page-not-found-error-with-glitch-effect-on-screen-vector-illustration-for-your-design-.jpg`}`)
            .setDescription(`|| @everyone ||\nNome de usuário do candidato: **${this.account.minecraft.nickname || 'Não encontrado...'}**\nTempo de formulário: **${TimeFormatter.BR_TIMER.format(Date.now() - this.formTimeOffset)}**\nPerguntas respondidas: **${this.asks.length}/${this.forms.length}**`).setFooter('Formulário enviado para equipe em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))
          channel.send(`Segue o registro das respostas 👇`, attachment);
          this.user.send(embed).then(() => { }).catch(() => { });
        }
        await Bot.fromHandler('forms').createCache(this.account.minecraft.nickname.toLowerCase());
        await Bot.fromHandler('forms').updateCache(this.account.minecraft.nickname.toLowerCase(), {
          minecraft: {
            nickname: this.account.minecraft.nickname,
            uuid: this.account.minecraft.uuid
          },
          user: this.user.id,
          role: this._role,
          guild: this.guild.id,

        }, true)
      }

    }
  }
  private async preSaveProgress() {

    this.currentOffset = 100; // 
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
      setAuthor(`Finalmente terminamos 😉!`, `https://i.imgur.com/gntqLpd.gif`).
      setDescription(`
     
    Para finalizar o formulário precisamos da sua confirmação :smile:!
     
     \`\`\`json\n🧐 Vamos-lá, para finalizar clique em ✅!\`\`\`
 
     `).setFooter(`Formulário quase finalizado: ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/2/Processo+conclu%C3%ADdo%21/Deseja+finalizar%3F`);
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
      puppeteerArgs: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      },
      transparent: true,
      html: buildProgressiveCircle(Math.round((this.currentOffset / this.forms.length) * 100))
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
        setAuthor(`${(this.currentOffset / this.forms.length) * 100 > 70 ? 'Estamos quase lá' : 'Estamos só no começo...'}`, `https://emoji.gg/assets/emoji/4327_5000_BITS_TWITCH_DONATE.gif`).
        setDescription(`Fique a vontade para digitar o que quiser, porém não exagere nas palavras iremos avaliar tudo
      durante o processo de seleção.

\`\`\`json\n${ask}${obligated ? ` - [OBRIGATÓRIA] ` : ``}\`\`\`${note ? `\n\n**Nota da equipe**: ${note}` : ``}

**Nota importante: Demora um pouco para computar sua resposta certa de 1-5 segundos**

Cargo a ser ofertado: **${this._role}**

 `).setFooter(`Pergunta ${this.currentOffset + 1}/${this.forms.length}`).setImage(`https://minecraftskinstealer.com/achievement/17/Formul%C3%A1rios%21/Responda+se+poss%C3%ADvel%21`))
      const collector = this.user.dmChannel?.createMessageCollector(a => a.author.id == this.user.id);
      if (collector) {
        collector.on('collect', async (message: Message) => {
          collector.stop();
          if (!this.asks.includes(this.currentOffset)) this.asks.push(this.currentOffset)
          this.actions.push(`[${new Date(Date.now()).toUTCString()}] Ação de pergunta:
     Pergunta: ${ask}
     Resposta: ${message.content}
     
     Estatísticas:
      Respondida em: ${TimeFormatter.BR_TIMER.format(Date.now() - this.lastAction)}
      É obrigatória: ${obligated ? `Sim` : 'Não'}
      `)
          this.currentOffset += 1;
          this.generateTab();
        });
      }


      this.message.react('❌')
      if (this.currentOffset > 0) {
        this.message.react('⬅️')
      }
      if (this.currentOffset < this.forms.length) {
        if (!obligated || this.asks.includes(this.currentOffset))
          this.message.react('➡️')
      }
    } catch (err) {

    }

  }

  public static get(id: string): Forms {
    return this.cache.get(id) as Forms
  }

  public static remove(id: string): void {
    this.cache.delete(id);
  }

  public static build(user: User, guild: Guild, role: string): Forms {
    if (!this.cache.has(`${user.id}`)) {
      this.cache.set(`${user.id}`, new Forms(user, guild, role));
    }

    return this.cache.get(`${user.id}`) as Forms;

  }
  public get user() { return this._user; }
  public get guild() { return this._guild; }

}