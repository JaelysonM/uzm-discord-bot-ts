import { Guild, MessageEmbed, TextChannel, User } from "discord.js";
import { ArgsOf } from "../../classes/types/ArgsOf";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import EventHandler from "../../handlers/EventHandler";
import IssueManager from "../../managers/IssueManager";
import TimeFormatter from "../../utils/TimeFormatter";

export default class MicsListeners {

  @EventHandler('message')
  async onSpamCheck([message]: ArgsOf<'message'>) {
    if (message.author.bot) return;
    if (message.member == null) return;
    const content = message.content;

    if (content.search(`/((?:discord\.gg|discordapp\.com|www\.|htStp|invite))/g`) >= 0) {
      if (!message.member.hasPermission(8)) {
        message.delete()
        let ErroEmbed = new MessageEmbed()
          .setColor(`#36393f`)
          .setTitle(`Palavra banida ou mensagem divulgativa!`)
          .setDescription("\n Sua mensagem foi detectada como uma frase de calão divulgativo ou contém uma \n palavra banida! você pode ser banido pelo sistema de auto-moderação. \n \n Necessário permissão de \`ADMINISTRADOR\` para enviar esta mensagem.")
        message.channel.send(ErroEmbed).then(async message => { try { await message.delete({ timeout: 6000 }) } catch (error) { } })
      }
    }
  }

  @EventHandler('messageReactionAdd')
  async onReportMessageReaction([reaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (user.bot) return;
    if (!reaction) return;
    if (reaction.message.guild == null) return;
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(reaction.message.guild.id);


    const embed = reaction.message.embeds[0];
    if (!embed) {
      return;
    }
    if (!embed.thumbnail?.url || !embed.color || !embed.footer?.text || !embed.description || !embed.author?.name || !embed.author.proxyIconURL) return;


    if (reaction.emoji.name == '✅' || reaction.emoji.name == '❌') {
      const commandIssues = await new IssueManager(reaction.message.guild as Guild).finder().issues(async (obj, objs) => {
        if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)) {
          objs.push('guilds.attendance');
          obj = Object.assign(obj, {
            guilds: {
              attendance: null
            }
          });
        } else {
          if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.reportAccepted)) {
            objs.push('channels.reportAccepted');
            obj = Object.assign(obj, {
              channels: {
                reportAccepted: null
              }
            });
          }
          if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.attendance)?.channels.cache.find(c => c.id == settings.channels.reportRejected)) {
            objs.push('channels.reportRejected');
            obj = Object.assign(obj, {
              channels: {
                reportRejected: null
              }
            });
          }
        }
      });

      if (commandIssues) return;
      if (reaction.emoji.name == '✅') {
        if (embed.description?.includes('Punição aplicada em:') || embed.description?.includes('Punição recusada em')) {
          reaction.users.remove(user as User)
          return;
        }

        const { username, discriminator } = {
          username: embed.author?.name?.split(' - ')[0].split('#')[0],
          discriminator: embed.author?.name?.split(' - ')[0].split('#')[1]
        }
        reaction.message.edit(new MessageEmbed().setColor(embed?.color).setThumbnail(embed?.thumbnail?.url).setFooter(embed.footer.text).setDescription(`${embed.description}\n\nPunição aplicada em: **${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}**\npor ***${user.username}***.`).setAuthor(embed.author.name, embed.author.proxyIconURL));

        const newUser = Bot.instance.client.users.cache.find(user => user.username === username && user.discriminator == discriminator);
        const reportedName = embed.thumbnail.url.split('https://minotar.net/avatar/')[1];
        if (newUser) {
          try {
            newUser.send(new MessageEmbed().setTitle(`Denúncia aceita e acusado punido - ${reportedName}!`).setDescription(`Sua denúncia foi **aceita**, foi averiguado as provas e o motivo inserido e foi possível aplicar a punição sobre. Caso você possua novas provas de novos reportes poderá criar novas denúncias e acabar ajudando a rede cada vez mais.
              Pedimos que não faça flood de denúncias, pois poderá ficar sujeito a ser punido pelo tal motivo.`))

          } catch (error) { }
        }
        const acceptChannel = Bot.instance.client.guilds.cache.get(settings.guilds.attendance)?.channels.cache.get(settings.channels.reportAccepted);

        if (acceptChannel) {

          (acceptChannel as TextChannel).send(new MessageEmbed()
            .setAuthor(`Resultado da denúncia de ${username}`, `https://media0.giphy.com/media/geKGJ302nQe60eJnR9/giphy.gif`).setThumbnail(embed.thumbnail.url)
            .setDescription(`A denúncia do ${reportedName}, foi aceita as provas foram averiguadas e aprovadas sobre condições de punição. A punição já foi aplicada dentro do servidor!
            
            Aceita por **${user.username}**.`).setFooter(`Denúncia respondida em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
          reaction.message.delete();
        }
      }
      else if (reaction.emoji.name == '❌') {
        if (embed.description.includes('Punição aplicada em:') || embed.description.includes('Punição recusada em')) {
          reaction.users.remove(user as User)
          return;
        }

        const { username, discriminator } = {
          username: embed.author.name.split(' - ')[0].split('#')[0],
          discriminator: embed.author.name.split(' - ')[0].split('#')[1]
        }
        const reportedName = embed.thumbnail.url.split('https://minotar.net/avatar/')[1];
        reaction.message.edit(new MessageEmbed().setColor(embed.color).setThumbnail(embed.thumbnail.url).setFooter(embed.footer.text).setDescription(`${embed.description}\n\nPunição recusada em: **${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}**\npor ***${user.username}***.`).setAuthor(embed.author.name, embed.author.proxyIconURL));
        const newUser = Bot.instance.client.users.cache.find(user => user.username === username && user.discriminator == discriminator);
        if (newUser) {
          try {
            newUser.send(new MessageEmbed().setTitle(`Denúncia negada - ${reportedName}!`).setDescription(`
              Sua denúncia foi **negada** por falta de provas ou provas que são insuficientes para aplicar a punição ao jogador. Caso você possua mais provas para comprovar a suposta infração cometida pelo jogador, por favor, crie outra denúncia.
              
              Pedimos encarecidamente que não criem outra denúncia utilizando as mesmas provas que foram utilizadas nesta. Caso isso seja feito, você poderá ser punido pelo mesmo.`))
          } catch (err) { }

        }
        const denyChannel = await Bot.instance.client.guilds.cache.get(settings.guilds.attendance)?.channels.cache.get(settings.channels.reportRejected);
        if (denyChannel) {
          (denyChannel as TextChannel).send(new MessageEmbed()
            .setAuthor(`Resultado da denúncia de ${username}`, `https://media0.giphy.com/media/geKGJ302nQe60eJnR9/giphy.gif`).setThumbnail(embed.thumbnail.url)
            .setDescription(`A denúncia sobre o ${reportedName}, foi negada sendo assim não contendo provas concretas ou suficientes.
            
            Negada por **${user.username}**.`).setFooter(`Denúncia respondida em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
          reaction.message.delete();
        }

      }
    }

  }
}