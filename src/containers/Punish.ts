import { Guild } from "discord.js";
import IssueManager from "../managers/IssueManager";
import Bot from "./Bot";


export class PunishData {
  timestamp?: Number
  name?: String
}

export function runCleanTask() {

  setInterval(async () => {
    (await Bot.fromHandler('settings').list(true)).forEach(async (settings: any, g: any) => {
      const guild = Bot.instance.client.guilds.cache.find(guild => guild.id == g);
      if (!guild) return;

      const commandIssues = await new IssueManager(guild as Guild).finder().issues(async (obj, objs) => {
        if (!Bot.instance.client.guilds.cache.find(g => g.id == settings.guilds.main)) {
          objs.push('guilds.main');
          obj = Object.assign(obj, {
            guilds: {
              main: null
            }
          });
        } if (!guild?.roles.cache.find(r => r.id == settings.roles.muted)) {
          objs.push('roles.muted');
          obj = Object.assign(obj, {
            roles: {
              muted: null
            }
          });
        }
      }, (settings: any) => {
        if (settings.type != 'PRINCIPAL') {
          return true;
        }
        return false;
      });

      if (commandIssues) return;

      guild.roles.cache.find(r => settings.roles.muted == r.id)?.members.forEach(async member => {
        const account = await Bot.fromHandler('account').getCache(member.user.id);
        if (account.muteTimestamp != 0 && Date.now() > account.muteTimestamp) member.roles.remove(settings.roles.muted);
      })
    })
  }, 1000 * 60 * 5)
}
