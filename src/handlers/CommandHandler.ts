import { Message } from "discord.js";
import Bot from "../containers/Bot";
import { ICommand, ICommandHelp } from "../interfaces/CommandInterfaces";

export default abstract class CommandHandler implements ICommand {
  isValid(label: string): boolean {
    return this.getHelp().name === label || (this.getHelp().aliases?.includes(label) as boolean);
  }
  abstract getHelp(): ICommandHelp;
  abstract run(bot: Bot, message: Message, args: string[], command: string): Promise<void>;

}