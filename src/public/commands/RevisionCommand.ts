import { Guild, Message, MessageEmbed } from "discord.js";
import Bot from "../../containers/Bot";
import SettingsCache from "../../database/cache/SettingsCache";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";
import IssueManager from "../../managers/IssueManager";
import { sendMessageAndDelete } from "../../utils/MessageUtils";

export default class RevisionCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "revisão",
      description: 'Recebe o formulário para revisão de punições;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(message.guild?.id as string);

    const commandIssues = await new IssueManager(message.guild as Guild).finder().commandIssues(message, async (obj, objs) => {

    }, (settings: any) => {
      if (!settings.booleans.reviews) {
        message.channel.send(`🚫 A criação de revisões foi desabilitada por um superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
        return true;
      }

      return false;
    });

    if (commandIssues) return;
    if (!settings.booleans.reviews) {
      return message.channel.send(`🚫 A criação de revisões foi desabilitada por um superior.`).then(async message => { try { await message.delete({ timeout: 2000 }) } catch (error) { } });
    }
    sendMessageAndDelete(message.channel, new MessageEmbed()
      .setDescription(settings.messages_content.review)
      .setColor(`#36393f`), 6000);

  }

}