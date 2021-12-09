import { ArgsOf } from '../../classes/types/ArgsOf';
import Forms from '../../containers/Forms';
import Suggestion from '../../containers/Suggestion';
import EventHandler from '../../handlers/EventHandler';


export default class RegistrationListeners {

  @EventHandler('messageReactionAdd')
  async onAntiSpam([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    if (Suggestion.get(user.id)) {
      const container = Suggestion.get(user.id);
      if (container.user == user && container.user.dmChannel?.id == messageReaction.message.channel.id) {
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
              await container.generateTab()
            }
            break;
          case '➡️':
            if (container.currentOffset >= 0) {
              try {
                await messageReaction.users.remove(user.id)
              } catch (err) { }
              container.currentOffset += 1;
              await container.generateTab()
            }
            break;
          case '✅':
            if (container.currentOffset >= container.forms.length) {
              try {
                await messageReaction.users.remove(user.id)
              } catch (err) { }
              await container.destroy(user, true)
            }
            break;

        }
      }

    }

  }
}