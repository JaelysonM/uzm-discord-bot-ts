import { Message, MessageAttachment, MessageEmbed, MessageReaction, User } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import { sendMessageAndDelete } from "../../utils/MessageUtils";
import TimeFormatter from "../../utils/TimeFormatter";
import { dotify, downloadFile } from "../../utils/Functions";

export default class SayCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "uploadc",
      roles: ['ADMIN_PERM'],
      description: 'Abre um painel para o upload de configurações mais customizadas.'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);
    try {
      const msg = await sendMessageAndDelete(message.channel, new MessageEmbed()
        .setAuthor(`Atualização de configurações`, `https://media2.giphy.com/media/ME2ytHL362EbZksvCE/giphy.gif`)
        .setFooter(`Tentativa de configuração iniciada em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`).setColor('#ffd500').setImage(`https://minecraftskinstealer.com/achievement/11/${message.author.username.replace(' ', '+')}/Vamos-l%C3%A1%3F`)
        .setDescription(`\n\nVocê iniciou o envio de **configurações** do servidor:
      **Seu servidor**:

      ✍️ Nome: ${message.guild?.name}
      📃 Configurado previamente: ${settings.configured ? "Sim" : "Não"}
      📌 Faltam quantos dados?: ${(await (await cache.listMissingData(settings)).length)}

      Tendo em vista a ampla possibilidade de configuração, e por sua vez alguns são meio que
      inviáveis de serem feitas por comandos e etc, nós disponibilizamos esse comando para entusiastas,
      uma vez que, envolve um mínimo de conhecimento de \`\`Java Script Object Notation (JSON)\`\`.

      Para tanto, você pode se aventurar nessa configuração mais afundo, porém recomendamos que você
      **chame um especialista** ou até mesmo a nossa equipe para realizar uma vistoria do seu **Arquivo JSON**.

      > Reaja com  ❌  para cancelar, ou aguarde \`\`20s\`\` para **cancelar automaticamente**.
      
      > Deseja baixar as configurações atuais? reaja com 🧾!
      
      Deseja ter como base algum arquivo? [Clique aqui!](https:/pastebin.com)

      **Obs**: Formatos aceitos **arquivos .json** ou uma mensagem com o formato \`\`\`json\n{\n  "example": "Example"\n}\n\`\`\`
      `), 20000)

      await msg.react('❌')
      await msg.react('🧾')

      const collector = message.channel.createMessageCollector(a => a.author.id == message.author.id, { time: 1000 * 20, max: 1 });
      const collectorReaction = msg.createReactionCollector((reaction: MessageReaction, user: User) => user.id == message.author.id && (reaction.emoji.name == '❌' || reaction.emoji.name == '🧾'), { time: 1000 * 20, max: 1 });

      collectorReaction.on('collect', async (reaction, reactionCollector) => {
        await reaction.users.remove(message.author)
        switch (reaction.emoji.name) {
          case '❌':
            collector.stop();
            await reaction.message.delete().then(() => { }).catch((err) => { });
            sendMessageAndDelete(message.channel, `> 📌 Você cancelou a configuração do servidor!`, 5000)
            break;
          case '🧾':
            collector.stop();
            const downloadMessage = await sendMessageAndDelete(reaction.message.channel, new MessageEmbed()
              .setTitle(`Este processo pode demorar alguns segundos`).setThumbnail(`https://media0.giphy.com/media/Tk25o3pwpdbQqUS8Ht/giphy.gif`)
              .setDescription(`O sistema está gerando e baixando um arquivo com suas configurações.`)
              .setColor(`#36393f`), 10000);
            var buf = await Buffer.from(JSON.stringify(settings, null, '\t'), 'utf8');
            const attachment = new MessageAttachment(buf, `your-configs.json`);
            downloadMessage.channel.send(attachment);
            downloadMessage.edit(new MessageEmbed()
              .setAuthor(`Configurações baixadas 🥳!`, `https://i.imgur.com/qK2TuTI.gif`)
              .setDescription(`Você baixou o arquivo de configurações do servidor ${reaction.message.guild?.name}!
              
              Veja com calma e se for enviar um arquivo ou algum dado envie apenas o que você mudou ok 😉?`).setFooter(`Arquivos de configuração baixados em ${TimeFormatter.BR_COMPLETE_DATE.format(Date.now())}`)
              .setColor('#55e309'))
            await reaction.message.delete().then(() => { }).catch((err) => { });
            break;
        }
      });

      collector.on('collect', async (message: Message) => {

        let json;
        if (message.content.startsWith('```json\n') && message.content.endsWith('\n```')) {
          try {
            const extractedJSON = ('start' + message.content + 'end').replace('start```json\n', '').replace('\n```end', '');
            json = JSON.parse(extractedJSON);

          } catch (err) {
            message.reply(`📌 A mensagem enviada se começar com  \`\`\`json deve obedecer o formator JSON ok 😉?`).then(async (message: Message) => { try { await message.delete({ timeout: 5000 }) } catch (error) { } })
            message.delete();
          }
        } else {
          const file = message.attachments.first();
          if (file) {
            if (!(file.name?.endsWith('.json'))) {
              message.reply(`🚫 Arquivo inválido! ${file.name} deve ser um arquivo .json!`).then(async (message: Message) => { await message.delete({ timeout: 1500 }).then(() => { }).catch((error) => { }) })
              return;
            }
            await msg.reactions.removeAll();
            try {
              const { data } = await downloadFile(file.attachment as string, 'json');

              const dot = dotify(data);
              const composeChanges = () => {

                if (Object.keys(dotify(data)).length == 0) { return `\`\`\`css\n[Não há alterações]\`\`\`` }

                if (Object.keys(dot).length <= 5) {
                  return `\`\`\`json\n${Object.keys(dot).map(key => `✔ "${key}"`).join('\n')}\`\`\``
                } else {
                  return `\`\`\`json\n${Object.keys(dot).slice(0, 5).map(key => `✔ "${key}"`).join('\n')}\n\noutros ${Object.keys(dot).length - 5}...\`\`\``
                }
              }

              const settings = SettingsCache.instance();
              settings.updateCache(message.guild?.id, data, true)
              await msg.edit(new MessageEmbed()
                .setAuthor(`Configurações atualizadas!`, `https://media3.giphy.com/media/chiLb8yx7ZD1Pdx6CF/giphy.gif`)
                .setColor('#00f7ff')
                .setImage(`https://minecraftskinstealer.com/achievement/2/Foram+feitas/${Object.keys(dot).length}+${Object.keys(dot).length < 2 ? 'alteração' : 'alterações'}`)
                .setDescription(`\n\nVocê alterou as ** configurações ** do servidor: \`\`\`css\n${message.guild?.name} \`\`\``).addField('**Alterações realizadas:**', `${composeChanges()}`))
              collectorReaction.stop();
              await msg.delete({
                timeout: 5000
              }).then(() => { }).catch(() => { });
              await message.delete().then(() => { }).catch(() => { });
            } catch (err) {
              console.log(err)
              collectorReaction.stop();
              message.reply(`🚫 Arquivo inválido! ${file.name} não contem o formato padrão de um arquivo .json.`).then(async message => { try { await message.delete({ timeout: 1500 }) } catch (error) { } })
              await msg.delete().then(() => { }).catch(() => { });
              await message.delete().then(() => { }).catch(() => { });
            }

          } else {
            collectorReaction.stop();
            message.reply('🚫 Não existe nenhum arquivo nessa mensagem enviada.').then(async (message: Message) => { await message.delete({ timeout: 1500 }).then(() => { }).catch((error) => { }) })
            await msg.delete().then(() => { }).catch(() => { });
            await message.delete().then(() => { }).catch(() => { });
          }
        }
      });


    } catch (err) {
      sendMessageAndDelete(message.channel, `🚫 Ocorreu um erro inesperado, tente novamente!: ${`Invalid Form Body.`}`, 5000)

    }

  }

}