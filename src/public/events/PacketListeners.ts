import { ArgsOf } from "../../classes/types/ArgsOf";
import Bot from "../../containers/Bot";
import EventHandler from "../../handlers/EventHandler";

export default class PacketListener {
  @EventHandler('guildMemberUpdate')
  async onMemberUpdate([member, newMember]: ArgsOf<'guildMemberUpdate'>) {
    member.roles.cache.map(value => {
      if (newMember.roles.cache.find(r => r.id == value.id) == null) {
        Bot.instance.client.emit('guildMemberRoleRemoved', newMember, value)
        return;
      }
    })
    newMember.roles.cache.map(value => {
      if (member.roles.cache.find(r => r.id == value.id) == null) {
        Bot.instance.client.emit('guildMemberRoleAdded', newMember, value)
        return;
      }
    })
    if (newMember.nickname != member.nickname) {
      Bot.instance.client.emit('guildMemberNicknameUpdated', newMember, newMember.nickname, member.nickname)
      return;
    }
    if (newMember.user?.username != member.user?.username) {
      Bot.instance.client.emit('guildMemberUsernameUpdated  ', newMember, newMember.user?.username, member.user?.username)
      return;
    }
  }
}