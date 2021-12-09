import { Message } from "discord.js";
import Bot from "../../containers/Bot";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";

export default class ClearCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "limpar",
      roles: ['ADMIN_PERM'],
      description: 'Limpa a histórico de mensagens de um canal com um certo alcançe;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    if (args.length > 0) {
      const messages = await message.channel.messages.fetch({
        limit: parseInt(args[0])
      });
      await message.channel.messages.channel.bulkDelete(messages, true);
    } else {
      await message.reply("🚫 Use: /limpar <quantidade>.");
    }
  }

}