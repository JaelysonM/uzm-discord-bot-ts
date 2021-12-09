import { Guild, Message, MessageCollector, MessageEmbed, MessageReaction, ReactionCollector, Role, TextChannel, User } from "discord.js";
import log from "../services/logs";
import { isNumber } from "../utils/Functions";
import { sendMessageAndDelete } from "../utils/MessageUtils";
import TimeFormatter from "../utils/TimeFormatter";
import Bot from "./Bot";

export interface IDashboard {
  readonly guild: Guild;
  readonly channel: TextChannel;
  readonly user: User;
}

export default class Dashboard implements IDashboard {


  private _user: User;
  private _guild: Guild;
  private _channel: TextChannel;
  private currentOffset: number;
  private message: Message | any;


  constructor(user: User, guild: Guild, channel: TextChannel) {
    this._user = user;
    this._guild = guild;
    this._channel = channel;
    this.currentOffset = 0;
  }

  public async init() {
    await this.generateTab();
  }

  public async generateTab() {

    let embed: any;
    let reactions = [];
    let collectorFunction: any;

    const settings = await Bot.fromHandler('settings').getCache(this.guild.id as string);

    if (this.currentOffset == 0) {
      embed = new MessageEmbed().setTitle(`Painel de configuração rápida do servidor!`)
        .setDescription(`De acordo com suas permissões, você pode ativar ou desativar alguns sistemas além de conseguir alterar configurações por este painel.\n\n**Reaja com um emote específico para cada setor:**\n\`\`\`🎫 » Configurações dos tickets!\n🔒 » Configurações internas!\n🔧 » Configuração de sistemas a parte!\n\n❌ » Encerre o painel do configuração!\`\`\``)
        .setFooter(`Painel de configuração rápida iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/19/Configura%C3%A7%C3%B5es+r%C3%A1pidas%21/Reaja+com+um+emote%21`);
      reactions.push('🎫', '🔒', '🔧', '❌');

      collectorFunction = async (collector: MessageCollector, reaction: MessageReaction, user: User) => {
        switch (reaction.emoji.name) {
          case '❌':
            sendMessageAndDelete(this.channel, `> 📌 Você cancelou a configuração rápida do servidor!`, 5000)
            collector.stop();
            await (this.message as Message).delete().then(() => { }).catch((err) => { });
            break;
          case '🎫':
            this.currentOffset = 2;
            this.generateTab();
            collector.stop();
            break;
          case '🔒':
            this.currentOffset = 1;
            this.generateTab();
            collector.stop();
            break;
          case '🔧':
            this.currentOffset = 3;
            this.generateTab();
            collector.stop();
            break;
        }
      }
    } else if (this.currentOffset == 1) {
      embed = new MessageEmbed().setTitle(`Configurações internas!`)
        .setDescription(
          `De acordo com suas permissões, você pode ativar ou desativar alguns sistemas além de conseguir alterar configurações deste setor.\n\n**Reaja com um emote específico para ação:**\n\n\`\`\`json\n☝ » ID do servidor principal "${settings.guilds.main ? settings.guilds.main : 'Não registrado...'}"\n📞 » ID do servidor de atendimento "${settings.guilds.attendance ? settings.guilds.attendance : 'Não registrado...'}"\n🧾 » Altere a descrição do revisão!\n👑 » Altere o cargo que está disponível para o formulário!\n\n❌ » Encerre o painel do configuração!\`\`\``)
        .setFooter(`Painel de configuração rápida iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/13/Configura%C3%A7%C3%B5es+tickets%3A/Reaja+com+um+emote%21`);
      reactions.push('☝', '📞', '🧾', '👑', '❌');
      let internalEmbed;
      collectorFunction = async (collector: ReactionCollector, reaction: MessageReaction, user: User) => {
        switch (reaction.emoji.name) {
          case '❌':
            sendMessageAndDelete(this.channel, `> 📌 Você cancelou a configuração rápida do servidor!`, 5000)
            collector.stop();
            await (this.message as Message).delete().then(() => { }).catch((err) => { });
            break;
          case '👑':
            collector.stop();
            reaction.users.remove(this.user);

            const forms = await this.channel.send(new MessageEmbed().setTitle(`Escreva o cargo que deseja abrir para formulário`).setDescription(`\nVocê pode marcar o cargo ou colocar o seu ID.\n\n**OBS:** Para cancelar essa modificação digite \`\`cancelar\`\`.`));

            const messageCollectorForm = forms.channel.createMessageCollector(m => m.author.id == this.user.id, { time: 1000 * 10, max: 1 });
            messageCollectorForm.on('collect', async (collectMessage) => {
              const content = collectMessage.content;
              switch (content.toLowerCase()) {
                case 'cancelar':
                  collectMessage.delete();
                  collectMessage.reply(`> 📌 Você cancelou esta alteração.`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
                  await forms.delete().then(() => { }).catch((err) => { });
                  break;
                default:
                  await forms.delete().then(() => { }).catch((err) => { });
                  let roles;
                  if (collectMessage.mentions.roles.size > 0) {
                    roles = collectMessage.mentions.roles.find((channel: any) => true);
                  } else {
                    roles = this.guild.roles.cache.find((channel) => channel.id == collectMessage.content);
                  }
                  if (roles) {
                    log(this.guild, 'dashboard', `${this.user.username} alterou um cargo pelo dashboard: Offset-${this.currentOffset}`);

                    await Bot.fromHandler('settings').updateCache(this.guild.id, {
                      form: {
                        roles: [(roles as Role).name]
                      }
                    }, true);

                    collectMessage.reply(`✅ A vaga do formulário foi alterado para o cargo: ${content}.`).then(async (message: Message) => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })

                  } else {
                    collectMessage.reply(`📌 Mencione um cargo ou coloque o de um ID que exista ok 😉?`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
                    collectMessage.delete();
                  }
                  break;
              }
            }
            );
            break;
          case '🧾':
          case '☝':
          case '📞':
            collector.stop();
            reaction.users.remove(this.user);

            if (reaction.emoji.name == '🧾') {
              embed = new MessageEmbed().setTitle(`Escreva a descrição que deseja!`).setDescription(`\nnVocê pode escolher a descrição do formulário de revisão.\n\n**OBS:** Para cancelar essa modificação digite \`\`cancelar\`\`.`)

            } else {
              embed = new MessageEmbed().setTitle(`Escreva o ID que deseja!`).setDescription(`\nVocê pode escolher do servidor ${reaction.emoji.name == '☝' ? `principal` : `de antedimento`}!\n\n ** OBS:** Para cancelar essa modificação digite \`\`cancelar\`\`.`)
            }
            const msg = await this.channel.send(embed);

            const messageCollector = msg.channel.createMessageCollector(m => m.author.id == this.user.id, { time: 1000 * 10, max: 1 });
            messageCollector.on('collect', async (collectMessage) => {
              const content = collectMessage.content;
              switch (content.toLowerCase()) {
                case 'cancelar':
                  collectMessage.delete();
                  collectMessage.reply(`> 📌 Você cancelou esta alteração.`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
                  await msg.delete().then(() => { }).catch((err) => { });
                  break;
                default:
                  collectMessage.delete();
                  messageCollector.stop();
                  let obj: any;
                  if (reaction.emoji.name == '🧾') {
                    obj = {
                      messages_content: {
                        review: content
                      }
                    }
                    collectMessage.reply(`✅ Descrição do formulário de revisão foi alterado para: ${content}.`).then(async (message: Message) => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })
                    await Bot.fromHandler('settings').updateCache(this.guild.id, obj, true);
                  } else {
                    await Bot.instance.client.guilds.fetch(content, true).then(async g => {

                      if (reaction.emoji.name == '☝') {
                        obj = {
                          guilds: {
                            main: content
                          }
                        }
                      } else if (reaction.emoji.name == '📞') {
                        obj = {
                          guilds: {
                            attendance: content
                          }

                        }
                      }
                      await Bot.fromHandler('settings').updateCache(this.guild.id, obj, true);
                      log(this.guild, 'dashboard', `${this.user.username} alterou o ID de servidor pelo dashboard: Offset-${this.currentOffset}`);

                      collectMessage.reply(`✅ O ID do servidor ${reaction.emoji.name == '☝' ? `principal` : `de antedimento`} foi alterado para: ${content}.`).then(async (message: Message) => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })
                    }).catch(async () => {
                      msg.reply(`📌 Coloque um ID de um servidor que já possua nosso bot ok 😉?`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
                    });
                  }

                  await msg.delete().then(() => { }).catch((err) => { });
                  this.generateTab();
                  break;
              }
            });
            break;

        }
      }
    } else if (this.currentOffset == 2) {
      embed = new MessageEmbed().setTitle(`Configurações dos tickets!`)
        .setDescription(`De acordo com suas permissões, você pode ativar ou desativar alguns sistemas além de conseguir alterar configurações deste setor.\n\n**Reaja com um emote específico para ação:**\n\n\`\`\`json\n⏰ » Intervalo na criação "${settings.booleans.ticketsDelay ? 'Ativado' : 'Desativado'}"\n⚙ » Criação de tickets "${settings.booleans.tickets ? 'Ativado' : 'Desativado'}"\n🛢 » Capacidade da central "${settings.tickets.capacity + ' tickets'}"\n\n❌ » Encerre o painel do configuração!\`\`\``)
        .setFooter(`Painel de configuração rápida iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/13/Configura%C3%A7%C3%B5es+tickets%3A/Reaja+com+um+emote%21`)
      reactions.push('⏰', '⚙', '🛢', '❌');
      let internalEmbed;
      collectorFunction = async (collector: MessageCollector, reaction: MessageReaction, user: User) => {
        switch (reaction.emoji.name) {
          case '❌':
            sendMessageAndDelete(this.channel, `> 📌 Você cancelou a configuração rápida do servidor!`, 5000)
            collector.stop();
            await (this.message as Message).delete().then(() => { }).catch((err) => { });
            break;
          case '⏰':
            collector.stop();
            reaction.users.remove(user);

            await Bot.fromHandler('settings').updateCache(this.guild.id, {
              booleans: {
                ticketsDelay: !settings.booleans.ticketsDelay
              }
            }, true);
            log(this.guild, 'dashboard', `${this.user.username} mudou o estado do delay de tickets: Offset-${this.currentOffset}`);

            this.generateTab();
            break;
          case '⚙':
            collector.stop();
            reaction.users.remove(user);

            const msg = await this.channel.send(new MessageEmbed().setTitle(`Escreva a quantia que deseja!`).setDescription(`\nVocê pode escolher um limite de tickets, apenas escrevendo o número no chat de __1 até 200__.\n\n**OBS:** Para cancelar essa modificação digite \`\`cancelar\`\`.`));

            const messageCollector = msg.channel.createMessageCollector(m => m.author.id == this.user.id, { time: 1000 * 10, max: 1 });
            messageCollector.on('collect', async (collectMessage) => {
              const content = collectMessage.content;
              switch (content.toLowerCase()) {
                case 'cancelar':
                  collectMessage.delete();
                  collectMessage.reply(`> 📌 Você cancelou esta alteração.`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
                  await msg.delete().then(() => { }).catch((err) => { });
                  break;
                default:
                  collectMessage.delete();
                  messageCollector.stop();
                  let obj: any;

                  if (isNumber(content) && parseInt(content) <= 200 && parseInt(content) > 0) {
                    const quantity = parseInt(content);
                    await Bot.fromHandler('settings').updateCache(this.guild.id, {
                      tickets: {
                        capacity: quantity
                      }
                    }, true);
                    log(this.guild, 'dashboard', `${this.user.username} alterou a capacidade de tickets: Offset-${this.currentOffset}`);

                    collectMessage.reply(`✅ O número máximo de tickets foi alterado para ${content}.`).then(async (message: Message) => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })
                    await Bot.fromHandler('settings').updateCache(this.guild.id, obj, true);
                    await msg.delete().then(() => { }).catch((err) => { });
                    this.generateTab();
                  } else {
                    collectMessage.reply(`🚫 ${content} não se trata de um número entre 1 e 200.\n\nA alteração foi cancelada \`\`automaticamente\`\`.`).then(async (message: Message) => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })
                    await msg.delete().then(() => { }).catch((err) => { });
                  }
                  break;
              }
            });
            break;


        }
      }
    } else if (this.currentOffset == 3) {
      embed = new MessageEmbed().setTitle(`Configuração de sistemas a parte!`)
        .setDescription(`De acordo com suas permissões, você pode ativar ou desativar alguns sistemas além de conseguir alterar configurações deste setor.\n\n**Reaja com um emote específico para ação:**\n\n\`\`\`json\n🚫 » Criação de denúncias "${settings.booleans.reports ? 'Ativado' : 'Desativado'}"\n👀 » Criação de revisões "${settings.booleans.reviews ? 'Ativado' : 'Desativado'}"\n🧾 » Criação de formulários "${settings.booleans.forms ? 'Ativado' : 'Desativado'}"\n\n❌ » Encerre o painel do configuração!\`\`\``)
        .setFooter(`Painel de configuração rápida iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setImage(`https://minecraftskinstealer.com/achievement/1/Conf.%20Sistemas%20a%20parte:/Reaja+com+um+emote%21`);
      reactions.push('🚫', '👀', '🧾', '❌');
      collectorFunction = async (collector: MessageCollector, reaction: MessageReaction, user: User) => {
        switch (reaction.emoji.name) {
          case '❌':
            collector.stop();
            sendMessageAndDelete(this.channel, `> 📌 Você cancelou a configuração rápida do servidor!`, 5000)
            await (this.message as Message).delete().then(() => { }).catch((err) => { });
            break;
          case '👀':
            collector.stop();
            reaction.users.remove(user);

            await Bot.fromHandler('settings').updateCache(this.guild.id, {
              booleans: {
                reviews: !settings.booleans.reviews
              }
            }, true);
            log(this.guild, 'dashboard', `${this.user.username} mudou o estado das revisões: Offset-${this.currentOffset}`);

            this.generateTab();
            break;
          case '🧾':
            collector.stop();
            reaction.users.remove(user);

            await Bot.fromHandler('settings').updateCache(this.guild.id, {
              booleans: {
                forms: !settings.booleans.forms
              }
            }, true);
            this.generateTab();
            log(this.guild, 'dashboard', `${this.user.username} mudou o estado dos formulários: Offset-${this.currentOffset}`);

            break;
          case '🚫':
            collector.stop();
            reaction.users.remove(user);

            await Bot.fromHandler('settings').updateCache(this.guild.id, {
              booleans: {
                reports: !settings.booleans.reports
              }
            }, true);
            log(this.guild, 'dashboard', `${this.user.username} mudou o estado da criação de denúncias: Offset-${this.currentOffset}`);

            this.generateTab();
            break;
        }
      }
    }


    if (collectorFunction != undefined && embed != undefined) {
      if (this.message) {
        this.message.reactions.removeAll();
        this.message.edit(embed);
      } else {
        this.message = await this.channel.send(embed)
      }


      const reactionCollector = (this.message as Message).createReactionCollector((reaction: MessageReaction, user: User) => user.id == this._user.id, { time: 1000 * 60 * 2 });
      reactionCollector.on('collect', async (reaction, user) => {
        await collectorFunction(reactionCollector, reaction, user)
      });

      reactions.forEach(r => this.message.react(r))
    }
  }


  public get user() { return this._user; }
  public get guild() { return this._guild; }
  public get channel() { return this._channel; }


}