import { ArgsOf } from '../../classes/types/ArgsOf';
import StaffFormulary from '../../containers/StaffFormulary';
import EventHandler from '../../handlers/EventHandler';


export default class StaffFormularyListeners {

  @EventHandler('messageReactionAdd')
  async onAntiSpam([messageReaction, user]: ArgsOf<'messageReactionAdd'>) {
    const container = StaffFormulary.getFormulary(user);
    if (!!container) {
      if (container.user == user && container.user.dmChannel?.id == messageReaction.message.channel.id) {
        switch (messageReaction.emoji.name) {
          case '❌':
            await container.destroyFormulary(user)
            break;
          case '⬅️':
            if (container.offset > 0) {
              try { await messageReaction.users.remove(user.id) } catch (err) { }
              await container.formularyGenerateTab({
                tabAction: 'previous'
              })
            }
            break;
          case '➡️':
            if (container.offset >= 0) {
              try { await messageReaction.users.remove(user.id) } catch (err) { }
              await container.formularyGenerateTab({
                tabAction: 'next'
              })
            }
            break;
          case '✅':
            if (container.offset >= container.questions.length) {
              try { await messageReaction.users.remove(user.id) } catch (err) { }
              await container.destroyFormulary(user, true)
            }
            break;

        }
      }

    }

  }
}