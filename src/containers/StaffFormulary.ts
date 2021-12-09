import { Guild, MessageAttachment, MessageEmbed, Role, TextChannel, User } from "discord.js";
import FormularyHandler, { FormularyResult } from "../handlers/FormularyHandler";
import log from "../services/logs";
import TimeFormatter from "../utils/TimeFormatter";
import Bot from "./Bot";

export default class StaffFormulary extends FormularyHandler {
  constructor(user: User, guild: Guild, role: Role) {
    super(guild, user, `Cargo ${role.name}`);
  }
  async destroyFormulary(user?: User | undefined, save?: boolean) {
    super.destroyFormulary(user, save);

    let embedResult: MessageEmbed;
    if (this.user) {
      if (!save) {
        embedResult = new MessageEmbed().setAuthor(`Formulário para aplicação - ${this.guild.name} - ${this._prize}!`, `https://i.imgur.com/o5RTi2H.gif`).setDescription(`
      Seu formulário foi cancelado ${user == undefined ? `por ultrapassar 10 minutos de inatividade!` : `por você!`}. Caso queira refazer digite \`\`/formulario\`\` em qualquer chat do servidor.
      
     Pedimos que se tenha feito isso sem querer, tome cuidado na próxima vez, pois após o cancelamento todo o progresso é perdido.`)
        try { await Bot.fromHandler('forms').deleteCache(this.accountCache.minecraft.nickname.toLowerCase()) } catch (err) { }
      } else {
        embedResult = new MessageEmbed().setColor('#00e5ff').setImage(`https://minecraftskinstealer.com/achievement/7/Boa+sorte%21/Torcemos+por+voc%C3%AA`).setAuthor(`Formulário finalizado! - ${this.guild.name}!`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`)
          .setDescription(`
   
       Seu formulário para aplicação foi **concluído**! Uhuuuuu 🥳!
       
       Agradecemos pela sua paciência e colaboração durante todo esse processo que, convenhamos, é um pouco chato, mas não se preocupe o resto é com a gente 😉!

       **Servidor para qual foi feito**: ${this.guild.name}
       **O que foi ofertado**: ${this._prize}
       **Tempo de formulário**: ${TimeFormatter.BR_TIMER.format(Date.now() - this.timeMakingFormulary)}
       **Perguntas respondidas**: ${this.responses.size}/${this.questions.length}
  
       `).setFooter(`Nós da equipe do servidor estamos torcendo por você 💛!`)
      }

      if (!!this.guild.icon)
        embedResult.setThumbnail(this.guild.iconURL({
          dynamic: true,
          format: 'gif',
          size: 128
        }) as string);

      this.responsesRegistry.push(`------------------------------------------------------------------\nInformações finais:\n\n Tempo demorado: ${TimeFormatter.BR_TIMER.format(Date.now() - this.timeMakingFormulary)}\n Perguntas respondidas: ${this.responses.size}/${this.questions.length}\n Servidor para qual foi feito: ${this.guild.name}\n\n\nuzm-discord-bot by UzmStudio Inc. - All rights reserved [2019-${new Date().getFullYear()}]`)

    }
  }

  protected async composeResponsesRegistry(embedResult: MessageEmbed) {
    const attachment = new MessageAttachment(await Buffer.from(this.responsesRegistry.join(`\n`), 'utf8'), `${this.user.id}_formulary.txt`);
    const channel = Bot.instance.client.guilds.cache.find(g => g.id == this.settingCache.guilds.attendance)?.channels.cache.find(c => c.id == this.settingCache.channels.forms) as TextChannel;

    if (!!channel) {
      channel.send(new MessageEmbed()
        .setAuthor(`${this.user.username}#${this.user.discriminator} - Novo formulário!`, `https://emoji.gg/assets/emoji/2288-blurplecard.gif`)
        .setColor('#00e5ff').setThumbnail(`${this.accountCache.minecraft.nickname ? `https://minotar.net/avatar/${this.accountCache.minecraft.nickname}` : `https://previews.123rf.com/images/kaymosk/kaymosk1804/kaymosk180400006/100130939-error-404-page-not-found-error-with-glitch-effect-on-screen-vector-illustration-for-your-design-.jpg`}`)
        .setDescription(`|| @everyone ||\nNome de usuário do candidato: **${this.accountCache.minecraft.nickname || 'Não encontrado...'}**\nTempo de formulário: **${TimeFormatter.BR_TIMER.format(Date.now() - this.timeMakingFormulary)}**\nPerguntas respondidas: **${this.responses.size}/${this.questions.length}**`)
        .setFooter('Formulário enviado para equipe em ' + TimeFormatter.BR_COMPLETE_DATE.format(Date.now())))

      channel.send(`Segue o registro das respostas 👇`, attachment);
      this.user.send(embedResult).then(() => { }).catch(() => { });
    }
    await Bot.fromHandler('forms').createCache(this.accountCache.minecraft.nickname.toLowerCase());
    await Bot.fromHandler('forms').updateCache(this.accountCache.minecraft.nickname.toLowerCase(), {
      minecraft: {
        nickname: this.accountCache.minecraft.nickname,
        uuid: this.accountCache.minecraft.uuid
      },
      user: this.user.id,
      role: (this._prize as Role).name,
      guild: this.guild.id,

    }, true)
  }
  public static async formularyResult({ recruiter, recruited, response: { formularyInstance, result, reason } }: FormularyResult): Promise<void> {
    FormularyHandler.deleteFormulary(recruited)
    if (result == 'approved') {
      try {
        const roleInMain = Bot.instance.client.guilds.cache.get(formularyInstance.guild.id)?.roles.cache.find(r => r.name.toLowerCase() == (formularyInstance._prize as Role).name.toLowerCase());
        if (roleInMain) {
          Bot.instance.client.guilds.cache.get(formularyInstance.guild.id)?.members.cache.get(recruited.id)?.roles.add(roleInMain)
        }
        log(Bot.instance.client.guilds.cache.get(formularyInstance.guild.id) as Guild, 'autoRole', `${recruited.username} foi posto como ${(formularyInstance._prize as Role).name.toLowerCase()} através do sistema de formulários e pela aprovação de ${recruited.username}.`);

        if (!!recruited.dmChannel) {
          recruited.send(new MessageEmbed()
            .setFooter(`O resultado da formulário foi enviado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
            .setAuthor(`Seu formulário foi aceito!`, `https://i.imgur.com/WEBsTtU.gif`)
            .setDescription(
              `Nossa equipe analisou seu formulário e temos uma boa notícia! **Conseguimos o aprovar para participar da nossa equipe**.
                
                Nós em nome de toda a equipe lhe damos os nossos sinceros parabéns 🤗!
                
                Agora que você é da família, antes de qualquer coisa tenha responsabilidade com o próximo e ,sobretudo, com membros da nossa equipe, você não irá se arrepender iremos lhe recompensar de acordo com o devido esforço... 🤔
                
                Você irá receber nos dois servidores [equipe e principal] o seu respectivo cargo: **${(formularyInstance._prize as Role).name}**`))
        }
      } catch (err) { }
    } else {
      if (!!recruited.dmChannel) {
        recruited.send(new MessageEmbed()
          .setFooter(`O resultado da formulário foi enviado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
          .setAuthor(`Seu formulário foi reprovado!`, `https://i.imgur.com/o5RTi2H.gif`)
          .setDescription(
            `Nossa equipe analisou seu formulário  e infelizmente **não conseguimos te aprovar** para participar da nossa equipe.
          
          Mas antes de tudo segue a resposta parcial dos nossos analistas: 
          \`\`${reason}\`\`\
          Sabendo disso não desista novas oportunidades surgirão e na próxima pode ser a sua vez. 🤗
        
          
          Cargo ofertado: **${(formularyInstance._prize as Role).name}**`))
      }
    }

  }
}