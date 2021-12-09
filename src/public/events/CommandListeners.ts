import { ArgsOf } from "../../classes/types/ArgsOf";
import Account from "../../containers/Account";
import Bot from "../../containers/Bot";
import Registration from "../../containers/Registration";
import SettingsCache from "../../database/cache/SettingsCache";
import EventHandler from "../../handlers/EventHandler";
import { sendMessageAndDelete } from "../../utils/MessageUtils";

export default class CommandListeners {

  @EventHandler('message')
  async onCommandListening([message]: ArgsOf<'message'>) {
    if (!message.author.bot && message.channel.type != "dm") {

      if (!message.guild) return;
      const cache = SettingsCache.instance();
      const settings = await cache.getCache(message.guild?.id as string);

      const split = message.content.split(' ')
      const label = split[0].slice(settings.commandPrefix.length);
      const prefix = split[0].slice(0, settings.commandPrefix.length);
      const args = split.slice(1);

      const account = new Account(message.author, message.guild, settings);
      if (prefix === settings.commandPrefix) {
        const instance = Bot.instance.commands.find(c => c.isValid(label))
        if (message.guild?.id) {
          if (instance && !instance.getHelp().internal) {
            if (Registration.get(message.guild.id) && Registration.get(message.guild.id).channel == message.channel) {
              return;
            }
            await message.delete();
            if (account.hasCommand(instance)) {
              await instance.run(Bot.instance, message, args, label);
            } else {
              sendMessageAndDelete(message.channel, `🚫 Você não possui permissão para executar este comando.`, 2000);
            }
          }
        }

      }
    } else {
      // INTERNAL COMMAND
      const split = message.content.split(' ')
      const label = split[0].slice('/'.length);
      const prefix = split[0].slice(0, '/'.length);
      const args = split.slice(1);

      if (prefix === '/') {
        const instance = Bot.instance.commands.find(c => c.isValid(label))
        if (instance && instance.getHelp().internal) {
          await instance.run(Bot.instance, message, args, label);
        }
      }
    }
  }
}