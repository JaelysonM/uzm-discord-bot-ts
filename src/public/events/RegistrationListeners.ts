import { TextChannel, User } from 'discord.js';
import { ArgsOf } from '../../classes/types/ArgsOf';
import Registration from '../../containers/Registration';
import EventHandler from '../../handlers/EventHandler';

export default class RegistrationListeners {

  public static presenceQueue: User[] = [];

  @EventHandler('channelDelete')
  async onChannelDelete([channel]: ArgsOf<'channelDelete'>) {
    if (channel.type != 'dm') {
      if (Registration.get((channel as TextChannel).guild.id)) {
        const register = Registration.get((channel as TextChannel).guild.id);
        register.destroy(register.user, false);
      }
    }

  }
  @EventHandler('messageReactionAdd')
  async onAntiSpam([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (messageReaction.message.guild?.id != null) {
      if (Registration.get(messageReaction.message.guild.id)) {
        const container = Registration.get(messageReaction.message.guild.id);
        if (container.user == user && container.channel.id == messageReaction.message.channel.id) {
          if (!container.pageLock) {
            switch (messageReaction.emoji.name) {
              case '❌':
                await container.destroy(user);
                break;
              case '⬅️':
                if (container.currentOffset > 0) {
                  try {
                    await messageReaction.users.remove(user.id)
                  } catch (err) { }
                  container.currentOffset -= 1;
                  container.setPageLock(true);
                  await container.generateTab()
                }
                break;
              case '➡️':
                if (container.currentOffset >= 0) {
                  try {
                    await messageReaction.users.remove(user.id)
                  } catch (err) { }
                  container.currentOffset += 1;
                  container.setPageLock(true);
                  await container.generateTab()
                }
                break;
              case '✅':
                if (container.currentOffset >= container.missingData.length) {
                  try {
                    await messageReaction.users.remove(user.id)
                  } catch (err) { }
                  container.setPageLock(true);
                  await container.destroy(user, true)
                }
                break;

            }
          }
        }

      }
    }
  }
}