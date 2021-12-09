import { Guild, Message, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";

export default class SystemMessageCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "systemessage",
      roles: ['ADMIN_PERM'],
      description: 'Cria um embed das mensagens para o funcionamento de sistemas do bot.'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    if (args.length > 0) {
      if (args[0].toLocaleLowerCase() == 'atendimento') {
        message.channel.send(new MessageEmbed()
          .setTitle(`Área de atendimento ao jogador.`)
          .setDescription(`Clique em um emoji abaixo para ser redirecionado a\n criação de seu ticket, o atendimento será realizado por meio de suas mensagens privadas.\n\nAgora estamos com **0%** da central em uso.`)
          .setImage('https://minecraftskinstealer.com/achievement/19/Converse+conosco%21/Clique+no+emoji+abaixo.')
          .setColor(`#36393f`)).then(async msg => {
            await msg.react(`❓`)
          })
      } else if (args[0].toLocaleLowerCase() == 'captcha') {
        const guild = message.guild as Guild;
        const settings = await SettingsCache.instance().getCache(guild.id);
        const isReady = await SettingsCache.instance().isReady(guild.id);
        if (!isReady && !Registration.get(guild.id)) {
          return message.channel.send(`🚫 E criação desta mensagem não está disponível no momento, por falta de informações tanto em banco de dados quanto em cache.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
        }

        message.channel.send(new MessageEmbed()
          .setAuthor(isReady ? settings.name : Registration.get(guild.id).obj.name, `${guild.iconURL() ? guild.iconURL() : "https://media3.giphy.com/media/chiLb8yx7ZD1Pdx6CF/giphy.gif"}`)
          .setDescription(`Somente membros verificados possuem acesso aos canais do servidor.\n Complete a verificação clicando no emoji abaixo. `)
          .setColor(`#36393f`)).then(async msg => {
            await msg.react(`✅`)
          })
      }
      else {
        await message.reply("🚫 Use: /systemessage <catpcha | atendimento>.");
      }
    } else {
      await message.reply("🚫 Use: /systemessage <catpcha | atendimento>.");
    }
  }
}