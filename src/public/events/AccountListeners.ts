import { ArgsOf } from "../../classes/types/ArgsOf";
import AccountCache from "../../database/cache/AccountCache";
import SettingsCache from "../../database/cache/SettingsCache";
import EventHandler from "../../handlers/EventHandler";
import log from "../../services/logs";

export default class ReportListeners {

  @EventHandler('guildMemberRemove')
  async onMemberQuit([member]: ArgsOf<'guildMemberRemove'>) {
    await AccountCache.instance().updateCache(`${member.id}-${member.guild.id}`, {
      minecraft: {
        nickname: null,
        uuid: null,
      }
    }, true);
  }
  @EventHandler('guildMemberRoleRemoved')
  async onMutedRoleRemoved([member, role]: ArgsOf<'guildMemberRoleRemoved'>) {
    const cache = SettingsCache.instance();
    const settings = await cache.getCache(member.guild.id);
    if (role.id == settings.roles.muted) {
      log(member.guild, 'unmute', `${member.user?.username} foi perdoado do seu silenciamento de alguém misterioso.`);

      await AccountCache.instance().updateCache(`${member.id}-${member.guild.id}`, {
        muteTimestamp: 0
      }, true);
    }

  }
}