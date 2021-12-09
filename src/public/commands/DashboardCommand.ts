import { Guild, Message, TextChannel } from "discord.js";
import Bot from "../../containers/Bot";
import Dashboard from "../../containers/Dashboard";
import CommandHandler from "../../handlers/CommandHandler";
import { ICommandHelp } from "../../interfaces/CommandInterfaces";

export default class DashboardCommand extends CommandHandler {
  getHelp(): ICommandHelp {
    return {
      name: "dashboard",
      roles: ['ADMIN_PERM'],
      description: 'Abra o painel de configurações rápidas;'
    };
  }
  async run(bot: Bot, message: Message, args: string[], command: string): Promise<void> {
    new Dashboard(message.author, message.guild as Guild, message.channel as TextChannel).init()
  }

}