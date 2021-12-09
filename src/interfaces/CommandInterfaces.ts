import { Message } from 'discord.js';
import Bot from '../containers/Bot';

export interface ICommandHelp {
  name: string
  description?: string
  roles?: string[]
  aliases?: string[],
  internal?: boolean
}
export interface ICommand {
  isValid(label: string): boolean
  getHelp(): ICommandHelp
  run(bot: Bot, message: Message, args: string[], command: string): Promise<void>
}