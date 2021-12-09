require('dotenv').config();
import { Guild, User } from 'discord.js';

import { ICommand } from '../interfaces/CommandInterfaces';
import Bot from './Bot';

export interface IAccount {
  hasCommand(command: ICommand): boolean;
  listCommands(): ICommand[];
}

export default class Account implements IAccount {
  private settingData: any;
  private user: User;
  private guild: Guild;

  constructor(user: User, guild: Guild, settings: any) {
    this.user = user;
    this.guild = guild;
    this.settingData = settings;
  }
  hasCommand(command: ICommand): boolean {
    if (command.getHelp().roles && !this.listCommands().find(cmd => cmd == command)) {
      return false;
    } else {
      return true;
    }
  }
  listCommandsLabel(): string {
    return this.listCommands().filter(command => command.getHelp().name != 'ajuda').map(command => ` ⠀\`${this.settingData.commandPrefix}${command.getHelp().name}\` ${command.getHelp().description ? command.getHelp().description : 'Sem descrição!'}`).join(' \n');
  }
  listCommands(): ICommand[] {
    const permissions = [] as ICommand[];
    const member = this.guild.members.cache.find(m => this.user == m.user);
    Bot.instance.commands.forEach(cmd => {
      if (this.settingData.commands && this.settingData.commands[cmd.getHelp().name] && this.guild.roles.cache.find(role => role.id == this.settingData.commands[cmd.getHelp().name])) {
        if (member) {
          const role = this.guild.roles.cache.find(role => role.id == this.settingData.commands[cmd.getHelp().name]);
          if (role) {
            if (member.roles.highest.rawPosition >= role.rawPosition)
              permissions.push(cmd);
          }

        }
      } else {
        const roles = cmd.getHelp().roles;
        if (roles) {
          if (member) {
            if (roles.includes('DISCORD_OWNER')) {
              if (this.guild.owner == member)
                permissions.push(cmd);

            } else if (roles.includes('ADMIN_PERM')) {
              if (member.hasPermission('ADMINISTRATOR'))
                permissions.push(cmd);
            } else if (roles.includes('MANAGE_MESSAGES')) {
              if (member.hasPermission('MANAGE_MESSAGES'))
                permissions.push(cmd);
            }
          }
        } else {
          permissions.push(cmd);
        }
      }
    });
    return permissions;
  }

}