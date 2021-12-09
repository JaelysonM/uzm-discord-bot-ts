import { Message, MessageEmbed, MessageReaction, User } from "discord.js";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";

export default class RegisterCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "register",
      roles: ['ADMIN_PERM'],
      description: 'Registra por completo o servidor no banco de dados do bot;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);

    const listMissingData = (data: Object[]) => {
      if (data.length == 0) { return `\`\`\`css\n[Não há missing-data]\`\`\`` }
      if (Object.keys(data).length <= 5) {
        return `\`\`\`json\n${data.map(key => `✔ "${key}"`).join('\n')}\`\`\``
      } else {
        return `\`\`\`json\n${data.slice(0, 5).map(key => `✔ "${key}"`).join('\n')}\n\noutros ${data.length - 5}...\`\`\``
      }
    }

    const isReady = await cache.isReady(message.guild?.id as string);
    if (!isReady) {

      sendMessageAndDelete(message.channel, new MessageEmbed().
        setDescription(
          `Aqui estão listados algums dos dados que você terá que inserir: \n${listMissingData(await cache.listMissingDataTranslated(settings))}

      \`\`\`🔓 » Para iniciar;\n❌ » Para cancelar;\`\`\``).
        setColor('#7eeb3f').
        setAuthor(`Abertura de registro inicial.`, `https://i.imgur.com/Axy3rOC.gif`).
        setImage(`https://minecraftskinstealer.com/achievement/29/Registro+do+servidor/Vamos-lá%3F`).
        setFooter(`Tentativa de abertura de registro inicial iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`), 20 * 1000)
        .then(m => {
          m.react('🔓');
          m.react('❌');

          const collectorReaction = m.createReactionCollector((reaction: MessageReaction, user: User): boolean => { return user.id == message.author.id && (reaction.emoji.name == '❌' || reaction.emoji.name == '🔓') }, { time: 1000 * 20, max: 1 });
          collectorReaction.on('collect', async (reaction: MessageReaction, user: User) => {
            collectorReaction.stop();
            switch (reaction.emoji.name) {
              case '❌':
                sendMessageAndDelete(m.channel, `> 📌 Você cancelou a registro do servidor no banco de dados do bot!`, 5000);
                reaction.message.delete();
                break;
              case '🔓':
                m.reactions.removeAll();
                message.guild?.channels.create('cfginitial', {
                  type: 'text',
                  permissionOverwrites: [
                    {
                      id: user.id,
                      allow: ['VIEW_CHANNEL']
                    },
                    {
                      id: message.guild.roles.everyone,
                      deny: ['VIEW_CHANNEL']
                    }
                  ]
                }).then((channel) => {

                  m.edit(new MessageEmbed().
                    setDescription(`Tudo pronto! :smile: Agora você irá iniciar o registro deste servidor no banco de dados do nosso bot.

                Um canal com o seguinte nome será criado para que seja mais cômodo sua configuração :wink:

                    Clique e vá: <#${channel.id}>
      
                 **__Obs__: Enquanto você não finalizar por completo a configuração o bot ficará bloqueado para uso.**
                 **__Obs²__: Essa mensagem irá ser deletada automaticamente.**
                  `).
                    setColor('#7eeb3f').
                    setAuthor(`Abertura de registro inicial.`, `https://i.imgur.com/qK2TuTI.gif`).
                    setImage(`https://minecraftskinstealer.com/achievement/33/Estamos+quase+l%C3%A1%21/Procure+por+%23cfginitial`).
                    setFooter(`Tentativa de abertura de registro inicial iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`))
                  Registration.build(user, channel.guild, channel).init();

                }).catch(err => {
                  sendMessageAndDelete(m.channel, `> 📌 Não conseguimos criar um canal para a configuração, devido ao erro ${err.message}`, 5000);
                });
                break;
            }

          })
        });

    } else {
      sendMessageAndDelete(message.channel, new MessageEmbed()
        .setDescription(
          `Verificamos no banco de dados do **Bot** que este servidor já foi configurado inicialmente, porém posso verificar se há algum erro nos dados nesse momento.
        \`\`\`⚙️ » Para buscar por erros nos dados;\`\`\`
       `)
        .setColor('#fc4103')
        .setAuthor(`Abertura de registro inicial.`, `https://i.imgur.com/qK2TuTI.gif`).
        setFooter(`Tentativa de abertura de registro inicial iniciado em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
        , 10 * 1000).then(m => {
          m.react('⚙️')
        });
    }
  }
}